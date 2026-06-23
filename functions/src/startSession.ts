import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { getPersonaPrompt, Persona } from "./prompts/personas";

type Industry = "technology" | "finance" | "consulting";
type Difficulty = "beginner" | "intermediate" | "advanced";
type QuestionType = "behavioral" | "technical" | "situational";

interface StartSessionRequest {
  userId: string;
  persona: Persona;
  industry: Industry;
  difficulty: Difficulty;
}

interface StartSessionResponse {
  sessionId: string;
  question: string;
  questionType: QuestionType;
}

const VALID_PERSONAS: Persona[] = ["friendly", "tough", "technical"];
const VALID_INDUSTRIES: Industry[] = ["technology", "finance", "consulting"];
const VALID_DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

/**
 * Builds the user prompt that instructs GPT-4 to generate an opening
 * interview question based on industry and difficulty level.
 */
function buildUserPrompt(industry: Industry, difficulty: Difficulty): string {
  return `Generate an opening interview question for a candidate in the ${industry} industry at the ${difficulty} difficulty level.

The question should be appropriate for the difficulty:
- beginner: straightforward questions about basic experiences and motivations
- intermediate: questions requiring specific examples with measurable outcomes
- advanced: complex scenario-based questions requiring deep strategic thinking

Respond in JSON format with exactly these fields:
{
  "question": "The interview question text",
  "questionType": "behavioral" | "technical" | "situational"
}

Only output valid JSON. Do not include any other text.`;
}

/**
 * Calls OpenAI API with retry on timeout.
 * Retries once if the first call times out.
 */
async function callOpenAIWithRetry(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<{ question: string; questionType: QuestionType }> {
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

      const questionType = validateQuestionType(parsed.questionType);

      return {
        question: parsed.question,
        questionType,
      };
    } catch (error: unknown) {
      lastError = error;
      // Retry on timeout errors only
      if (attempt === 0 && isTimeoutError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * Validates the question type returned by GPT-4.
 * Falls back to "behavioral" if the type is invalid.
 */
function validateQuestionType(type: string): QuestionType {
  const validTypes: QuestionType[] = ["behavioral", "technical", "situational"];
  if (validTypes.includes(type as QuestionType)) {
    return type as QuestionType;
  }
  return "behavioral";
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
 * POST /startSession
 *
 * Starts a new practice session and returns the first AI-generated question.
 * Creates a session document in Firestore and calls OpenAI GPT-4 to generate
 * a contextually appropriate opening question based on persona, industry, and difficulty.
 */
export const startSession = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { userId, persona, industry, difficulty } =
    req.body as StartSessionRequest;

  // Validate required fields
  if (!userId || !persona || !industry || !difficulty) {
    res.status(400).json({
      error: "Missing required fields: userId, persona, industry, difficulty",
    });
    return;
  }

  if (!VALID_PERSONAS.includes(persona)) {
    res.status(400).json({
      error: `Invalid persona. Must be one of: ${VALID_PERSONAS.join(", ")}`,
    });
    return;
  }

  if (!VALID_INDUSTRIES.includes(industry)) {
    res.status(400).json({
      error: `Invalid industry. Must be one of: ${VALID_INDUSTRIES.join(", ")}`,
    });
    return;
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({
      error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
    });
    return;
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build prompts
    const systemPrompt = getPersonaPrompt(persona);
    const userPrompt = buildUserPrompt(industry, difficulty);

    // Call OpenAI with timeout retry
    const { question, questionType } = await callOpenAIWithRetry(
      openai,
      systemPrompt,
      userPrompt
    );

    // Create session document in Firestore
    const db = admin.firestore();
    const sessionRef = db
      .collection("users")
      .doc(userId)
      .collection("sessions")
      .doc();

    await sessionRef.set({
      persona,
      industry,
      difficulty,
      confidenceScore: null,
      avgStarScore: null,
      anxietyReading: null,
      fillerCount: null,
      avgWpm: null,
      duration: null,
      topSuggestions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const response: StartSessionResponse = {
      sessionId: sessionRef.id,
      question,
      questionType,
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("Error in startSession:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res.status(500).json({
      error: "Failed to start session. Please try again.",
      details: message,
    });
  }
});
