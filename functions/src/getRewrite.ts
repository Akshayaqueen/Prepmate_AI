import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";

interface GetRewriteRequest {
  sessionId: string;
  userId: string;
  turnNumber: number;
  transcript: string;
}

interface RewriteResponse {
  original: string;
  improved: string;
  improvements: string[];
}

/**
 * Builds the GPT-4 prompt that instructs it to rewrite the user's answer
 * with better STAR structure, stronger verbs, and quantified results —
 * while preserving the user's actual experiences (no fabrication).
 */
function buildRewritePrompt(transcript: string): string {
  return `You are an expert interview coach. A candidate gave the following response during an interview practice session:

"""
${transcript}
"""

Your task is to rewrite this response to be stronger and more impactful while following these strict rules:

1. PRESERVE the user's actual experiences, facts, and achievements exactly as stated. DO NOT fabricate any details, metrics, numbers, or achievements that the user did not mention.
2. Improve the STAR (Situation, Task, Action, Result) framework structure — ensure the response flows clearly through each component.
3. Use stronger, more impactful action verbs (e.g., "led" instead of "helped", "implemented" instead of "did").
4. Where the user mentioned approximate or vague results, keep them vague — do NOT invent specific numbers or percentages.
5. Make the response more concise and focused, removing filler words and redundancy.
6. Maintain the candidate's authentic voice and tone.

Respond in JSON format with exactly these fields:
{
  "improved": "The rewritten, improved version of the response",
  "improvements": ["3 to 5 specific bullet points describing what was improved and why"]
}

Only output valid JSON. Do not include any other text.`;
}

/**
 * Checks if an error is a timeout-related error.
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("etimedout") ||
      message.includes("econnaborted")
    );
  }
  return false;
}

/**
 * Calls OpenAI API with retry on timeout.
 * Retries once if the first call times out.
 */
async function callOpenAIWithRetry(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<{ improved: string; improvements: string[] }> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await openai.chat.completions.create(
        {
          model: "gpt-4",
          messages,
          response_format: { type: "json_object" },
        },
        { timeout: 15000 }
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const parsed = JSON.parse(content);

      // Validate the response structure
      const improved =
        typeof parsed.improved === "string"
          ? parsed.improved
          : "Unable to generate improved version.";

      const improvements: string[] = Array.isArray(parsed.improvements)
        ? parsed.improvements.filter((item: unknown) => typeof item === "string")
        : [];

      return { improved, improvements };
    } catch (error: unknown) {
      lastError = error;
      if (attempt === 0 && isTimeoutError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * POST /getRewrite
 *
 * On-demand rewrite for any specific answer from a practice session.
 * Takes the user's transcript and generates an improved version using GPT-4,
 * preserving the user's actual experiences while improving STAR structure,
 * action verbs, and quantified results.
 *
 * Optionally stores the rewrite in the turn document for future reference.
 */
export const getRewrite = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { sessionId, userId, turnNumber, transcript } =
    req.body as GetRewriteRequest;

  // Validate required fields
  if (!sessionId || !userId || turnNumber === undefined || !transcript) {
    res.status(400).json({
      error:
        "Missing required fields: sessionId, userId, turnNumber, transcript",
    });
    return;
  }

  if (typeof turnNumber !== "number" || turnNumber < 1) {
    res.status(400).json({
      error: "turnNumber must be a positive number",
    });
    return;
  }

  if (typeof transcript !== "string" || transcript.trim().length === 0) {
    res.status(400).json({
      error: "transcript must be a non-empty string",
    });
    return;
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build the rewrite prompt
    const systemPrompt =
      "You are an expert interview coach specializing in improving STAR-method responses. " +
      "You help candidates present their real experiences in the most compelling way possible. " +
      "You NEVER fabricate details or achievements — you only restructure and rephrase what the candidate actually said.";

    const userPrompt = buildRewritePrompt(transcript);

    // Call GPT-4 for the rewrite
    const { improved, improvements } = await callOpenAIWithRetry(
      openai,
      systemPrompt,
      userPrompt
    );

    // Optionally store the rewrite in the turn document
    try {
      const db = admin.firestore();
      const turnRef = db
        .collection("users")
        .doc(userId)
        .collection("sessions")
        .doc(sessionId)
        .collection("turns")
        .doc(String(turnNumber));

      const turnDoc = await turnRef.get();
      if (turnDoc.exists) {
        await turnRef.update({
          rewrittenAnswer: improved,
          improvements,
        });
      }
    } catch (storeError) {
      // Non-critical: log but don't fail the request if storage fails
      console.warn("Failed to store rewrite in turn document:", storeError);
    }

    // Return the rewrite results
    const response: RewriteResponse = {
      original: transcript,
      improved,
      improvements,
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("Error in getRewrite:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res.status(500).json({
      error: "Failed to generate rewrite. Please try again.",
      details: message,
    });
  }
});
