import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";

type Difficulty = "beginner" | "intermediate" | "advanced";
type ConfidenceCategory = "needs_work" | "developing" | "competent" | "confident";

interface FinalSpeechMetrics {
  avgWpm: number;
  totalFillerCount: number;
  finalAnxietyScore: number;
}

interface EndSessionRequest {
  sessionId: string;
  userId: string;
  finalSpeechMetrics: FinalSpeechMetrics;
}

interface RewrittenAnswer {
  original: string;
  improved: string;
  improvements: string[];
}

interface EndSessionResponse {
  confidenceScore: number;
  confidenceCategory: ConfidenceCategory;
  avgStarScore: number;
  anxietyReading: number;
  rewrittenAnswer: RewrittenAnswer;
  topSuggestions: string[];
  xpAwarded: number;
  sessionDuration: number;
}

/**
 * Calculates the confidence score from anxiety and STAR scores.
 * Formula: (100 - anxietyScore) × 0.6 + avgStarScore × 0.4
 */
export function calculateConfidenceScore(anxietyScore: number, avgStarScore: number): number {
  const score = (100 - anxietyScore) * 0.6 + avgStarScore * 0.4;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Determines the confidence category based on the score.
 * needs_work [0-39], developing [40-59], competent [60-79], confident [80-100]
 */
export function getConfidenceCategory(score: number): ConfidenceCategory {
  if (score >= 80) return "confident";
  if (score >= 60) return "competent";
  if (score >= 40) return "developing";
  return "needs_work";
}

/**
 * Awards XP based on session difficulty.
 * beginner: 10, intermediate: 20, advanced: 30
 */
export function awardXP(difficulty: Difficulty): number {
  const xpMap: Record<Difficulty, number> = {
    beginner: 10,
    intermediate: 20,
    advanced: 30,
  };
  return xpMap[difficulty];
}

/**
 * Calculates the average STAR score from all turns in the session.
 */
export function calculateAvgStarScore(turns: { starScore: number }[]): number {
  if (turns.length === 0) return 0;
  const total = turns.reduce((sum, turn) => sum + turn.starScore, 0);
  return Math.round(total / turns.length);
}

/**
 * Builds the GPT-4 prompt for rewriting the last behavioral response.
 * Preserves user's experiences while improving STAR structure.
 */
function buildRewritePrompt(transcript: string): string {
  return `You are an expert interview coach. Rewrite the following interview response to improve its STAR (Situation, Task, Action, Result) structure while preserving the candidate's actual experiences.

Rules:
- Preserve ALL of the user's actual experiences, facts, and details — do NOT fabricate or add achievements not mentioned
- Improve the structure to clearly follow STAR format
- Use stronger action verbs
- Add quantification where the original implies it (e.g., "helped many customers" → "assisted 50+ customers daily")
- Make the narrative flow more naturally
- Keep the response concise and impactful

Original response:
"${transcript}"

Respond in JSON format with exactly these fields:
{
  "improved": "The rewritten response with better STAR structure",
  "improvements": ["List of 2-4 specific improvements made"]
}

Only output valid JSON. Do not include any other text.`;
}

/**
 * Builds the GPT-4 prompt for generating top improvement suggestions
 * based on overall session performance.
 */
function buildSuggestionsPrompt(
  avgStarScore: number,
  anxietyScore: number,
  totalTurns: number,
  avgWpm: number,
  totalFillerCount: number
): string {
  return `You are an expert interview coach analyzing a practice session. Based on the following metrics, provide exactly 2 actionable improvement suggestions.

Session metrics:
- Average STAR Score: ${avgStarScore}/100
- Anxiety Reading: ${anxietyScore}/100
- Total Turns: ${totalTurns}
- Average WPM: ${avgWpm}
- Total Filler Words: ${totalFillerCount}

Context:
- STAR Score < 50 means responses lack structure
- Anxiety > 60 means the candidate shows nervousness through speech patterns
- WPM < 100 is too slow, > 180 is too fast (ideal: 120-160)
- High filler count indicates nervousness or lack of preparation

Respond in JSON format with exactly this field:
{
  "suggestions": ["First improvement suggestion", "Second improvement suggestion"]
}

Make suggestions specific, actionable, and encouraging. Each should be 1-2 sentences.
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
 */
async function callOpenAIWithRetry(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<string> {
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

      return content;
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
 * Calculates session duration in seconds from the session's createdAt timestamp
 * to the current time.
 */
function calculateSessionDuration(createdAt: FirebaseFirestore.Timestamp): number {
  const startTime = createdAt.toMillis();
  const endTime = Date.now();
  return Math.round((endTime - startTime) / 1000);
}

/**
 * POST /endSession
 *
 * Ends the session and returns final results with AI-generated rewrite
 * and improvement suggestions.
 *
 * 1. Loads session + all turns from Firestore
 * 2. Calculates avgStarScore from all turns
 * 3. Calculates confidenceScore using formula
 * 4. Determines confidence category
 * 5. Gets last turn's transcript, calls GPT-4 to rewrite it
 * 6. Generates top 2 improvement suggestions
 * 7. Awards XP based on difficulty
 * 8. Calculates session duration from timestamps
 * 9. Updates session document with all final scores
 * 10. Updates gamification doc (increment totalSessions)
 */
export const endSession = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { sessionId, userId, finalSpeechMetrics } = req.body as EndSessionRequest;

  // Validate required fields
  if (!sessionId || !userId || !finalSpeechMetrics) {
    res.status(400).json({
      error: "Missing required fields: sessionId, userId, finalSpeechMetrics",
    });
    return;
  }

  if (
    typeof finalSpeechMetrics.avgWpm !== "number" ||
    typeof finalSpeechMetrics.totalFillerCount !== "number" ||
    typeof finalSpeechMetrics.finalAnxietyScore !== "number"
  ) {
    res.status(400).json({
      error: "finalSpeechMetrics must contain avgWpm, totalFillerCount, and finalAnxietyScore as numbers",
    });
    return;
  }

  try {
    const db = admin.firestore();

    // 1. Load session document
    const sessionRef = db
      .collection("users")
      .doc(userId)
      .collection("sessions")
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const sessionData = sessionDoc.data()!;
    const difficulty = sessionData.difficulty as Difficulty;
    const createdAt = sessionData.createdAt as FirebaseFirestore.Timestamp;

    // Load all turns from Firestore
    const turnsSnapshot = await sessionRef
      .collection("turns")
      .orderBy("timestamp", "asc")
      .get();

    const turns = turnsSnapshot.docs.map((doc) => ({
      starScore: doc.data().starScore as number,
      transcript: doc.data().transcript as string,
    }));

    // 2. Calculate avgStarScore from all turns
    const avgStarScore = calculateAvgStarScore(turns);

    // 3. Calculate confidenceScore using formula
    const anxietyScore = finalSpeechMetrics.finalAnxietyScore;
    const confidenceScore = calculateConfidenceScore(anxietyScore, avgStarScore);

    // 4. Determine confidence category
    const confidenceCategory = getConfidenceCategory(confidenceScore);

    // 5. Get last turn's transcript and call GPT-4 for rewrite
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let rewrittenAnswer: RewrittenAnswer;

    if (turns.length > 0) {
      const lastTranscript = turns[turns.length - 1].transcript;

      const rewriteMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: "You are an expert interview coach." },
        { role: "user", content: buildRewritePrompt(lastTranscript) },
      ];

      const rewriteContent = await callOpenAIWithRetry(openai, rewriteMessages);
      const rewriteParsed = JSON.parse(rewriteContent);

      rewrittenAnswer = {
        original: lastTranscript,
        improved: rewriteParsed.improved || lastTranscript,
        improvements: Array.isArray(rewriteParsed.improvements)
          ? rewriteParsed.improvements
          : [],
      };
    } else {
      rewrittenAnswer = {
        original: "",
        improved: "",
        improvements: [],
      };
    }

    // 6. Generate top 2 improvement suggestions
    const suggestionsMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: "You are an expert interview coach." },
      {
        role: "user",
        content: buildSuggestionsPrompt(
          avgStarScore,
          anxietyScore,
          turns.length,
          finalSpeechMetrics.avgWpm,
          finalSpeechMetrics.totalFillerCount
        ),
      },
    ];

    const suggestionsContent = await callOpenAIWithRetry(openai, suggestionsMessages);
    const suggestionsParsed = JSON.parse(suggestionsContent);
    const topSuggestions: string[] = Array.isArray(suggestionsParsed.suggestions)
      ? suggestionsParsed.suggestions.slice(0, 2)
      : [];

    // 7. Award XP based on difficulty
    const xpAwarded = awardXP(difficulty);

    // 8. Calculate session duration from timestamps
    const sessionDuration = calculateSessionDuration(createdAt);

    // 9. Update session document with all final scores
    await sessionRef.update({
      confidenceScore,
      avgStarScore,
      anxietyReading: anxietyScore,
      fillerCount: finalSpeechMetrics.totalFillerCount,
      avgWpm: finalSpeechMetrics.avgWpm,
      duration: sessionDuration,
      topSuggestions,
    });

    // 10. Update gamification doc (increment totalSessions and add XP)
    const gamificationRef = db
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    await gamificationRef.set(
      {
        totalSessions: admin.firestore.FieldValue.increment(1),
        totalXP: admin.firestore.FieldValue.increment(xpAwarded),
      },
      { merge: true }
    );

    // Build response
    const response: EndSessionResponse = {
      confidenceScore,
      confidenceCategory,
      avgStarScore,
      anxietyReading: anxietyScore,
      rewrittenAnswer,
      topSuggestions,
      xpAwarded,
      sessionDuration,
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("Error in endSession:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res.status(500).json({
      error: "Failed to end session. Please try again.",
      details: message,
    });
  }
});
