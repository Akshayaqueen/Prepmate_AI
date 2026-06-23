import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { getPersonaPrompt, Persona } from "./prompts/personas";

type Industry = "technology" | "finance" | "consulting";
type Difficulty = "beginner" | "intermediate" | "advanced";
type QuestionType = "behavioral" | "technical" | "situational";

interface SpeechMetrics {
  wpm: number;
  fillerCount: number;
  anxietyScore: number;
  durationSeconds?: number;
}

interface StarBreakdown {
  situation: number;
  task: number;
  action: number;
  result: number;
}

interface SubmitResponseRequest {
  sessionId: string;
  userId: string;
  transcript: string;
  turnNumber: number;
  speechMetrics: SpeechMetrics;
}

interface SubmitResponseResult {
  starScore: number;
  starBreakdown: StarBreakdown;
  missingComponents: string[];
  lengthAdvisory: "too_short" | "too_long" | null;
  nextQuestion: string | null;
  questionType: QuestionType;
}

interface TurnDocument {
  question: string;
  questionType: string;
  transcript: string;
  starScore: number;
  starBreakdown: StarBreakdown;
  rewrittenAnswer: string | null;
  improvements: string[];
  speechMetrics: SpeechMetrics;
  timestamp: FirebaseFirestore.FieldValue;
}

interface GPT4EvaluationResponse {
  starBreakdown: StarBreakdown;
  missingComponents: string[];
  nextQuestion: string;
  questionType: QuestionType;
}

/**
 * Determines the length advisory based on speech duration.
 * - "too_short" if response is under 30 seconds
 * - "too_long" if response exceeds 180 seconds (3 minutes)
 * - null if within acceptable range
 *
 * Falls back to estimating duration from transcript word count
 * if durationSeconds is not provided (assumes ~140 WPM average pace).
 */
export function getLengthAdvisory(
  speechMetrics: SpeechMetrics,
  transcript: string
): "too_short" | "too_long" | null {
  let durationSeconds: number;

  if (speechMetrics.durationSeconds && speechMetrics.durationSeconds > 0) {
    durationSeconds = speechMetrics.durationSeconds;
  } else {
    // Estimate duration from word count assuming ~140 WPM
    const wordCount = transcript.trim().split(/\s+/).length;
    durationSeconds = (wordCount / 140) * 60;
  }

  if (durationSeconds < 30) {
    return "too_short";
  }
  if (durationSeconds > 180) {
    return "too_long";
  }
  return null;
}

/**
 * Builds the conversation context from previous turns for GPT-4.
 * Includes all Q&A pairs in chronological order so GPT-4 can
 * maintain context across the entire interview session.
 */
function buildConversationHistory(
  previousTurns: { question: string; transcript: string }[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  for (const turn of previousTurns) {
    messages.push({ role: "assistant", content: turn.question });
    messages.push({ role: "user", content: turn.transcript });
  }

  return messages;
}

/**
 * Builds the evaluation prompt that instructs GPT-4 to evaluate the
 * user's response using the STAR framework and generate a follow-up question.
 */
function buildEvaluationPrompt(industry: Industry, difficulty: Difficulty): string {
  return `You are evaluating the candidate's most recent response using the STAR (Situation, Task, Action, Result) framework. Also generate a relevant follow-up question for a ${industry} industry interview at ${difficulty} level.

Evaluate the response and respond in JSON format with exactly these fields:
{
  "starBreakdown": {
    "situation": <0-25 score for how clearly the situation/context was described>,
    "task": <0-25 score for how well the task/challenge was defined>,
    "action": <0-25 score for how specifically the actions taken were described>,
    "result": <0-25 score for how well the outcomes/results were communicated>
  },
  "missingComponents": [<array of STAR components that are weak or missing, e.g. "situation", "task", "action", "result">],
  "nextQuestion": "<a relevant follow-up question that probes deeper into the response or explores a new relevant topic>",
  "questionType": "behavioral" | "technical" | "situational"
}

Scoring guidelines:
- 0-5: Component completely absent
- 6-12: Component briefly mentioned but lacks detail
- 13-19: Component present with moderate detail
- 20-25: Component well-developed with specific details, metrics, or clear narrative

Only output valid JSON. Do not include any other text.`;
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
 * Calls OpenAI API with retry on timeout.
 * Retries once if the first call times out.
 */
async function callOpenAIWithRetry(
  openai: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<GPT4EvaluationResponse> {
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

      // Validate and clamp star breakdown scores
      const starBreakdown: StarBreakdown = {
        situation: clampScore(parsed.starBreakdown?.situation ?? 0, 0, 25),
        task: clampScore(parsed.starBreakdown?.task ?? 0, 0, 25),
        action: clampScore(parsed.starBreakdown?.action ?? 0, 0, 25),
        result: clampScore(parsed.starBreakdown?.result ?? 0, 0, 25),
      };

      const missingComponents: string[] = Array.isArray(parsed.missingComponents)
        ? parsed.missingComponents.filter(
            (c: unknown) => typeof c === "string"
          )
        : [];

      const questionType = validateQuestionType(parsed.questionType);

      return {
        starBreakdown,
        missingComponents,
        nextQuestion: parsed.nextQuestion || null,
        questionType,
      };
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
 * Clamps a numeric score within a given range.
 */
function clampScore(value: number, min: number, max: number): number {
  if (typeof value !== "number" || isNaN(value)) return 0;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * POST /submitResponse
 *
 * Submits a user's spoken response for AI evaluation and gets the next question.
 * Loads conversation history from Firestore, sends it to GPT-4 for STAR evaluation,
 * checks response length, stores the turn, and returns evaluation results.
 */
export const submitResponse = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { sessionId, userId, transcript, turnNumber, speechMetrics } =
    req.body as SubmitResponseRequest;

  // Validate required fields
  if (!sessionId || !userId || !transcript || turnNumber === undefined || !speechMetrics) {
    res.status(400).json({
      error:
        "Missing required fields: sessionId, userId, transcript, turnNumber, speechMetrics",
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
    const db = admin.firestore();

    // Load session document to get persona/industry/difficulty
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
    const persona = sessionData.persona as Persona;
    const industry = sessionData.industry as Industry;
    const difficulty = sessionData.difficulty as Difficulty;

    // Load all previous turns ordered by turn number
    const turnsSnapshot = await sessionRef
      .collection("turns")
      .orderBy("timestamp", "asc")
      .get();

    const previousTurns = turnsSnapshot.docs.map((doc) => ({
      question: doc.data().question as string,
      transcript: doc.data().transcript as string,
    }));

    // Build conversation messages for GPT-4
    const systemPrompt = getPersonaPrompt(persona);
    const evaluationPrompt = buildEvaluationPrompt(industry, difficulty);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: `${systemPrompt}\n\n${evaluationPrompt}` },
      ...buildConversationHistory(previousTurns),
      { role: "user", content: transcript },
    ];

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Call GPT-4 for evaluation
    const evaluation = await callOpenAIWithRetry(openai, messages);

    // Calculate total STAR score
    const starScore =
      evaluation.starBreakdown.situation +
      evaluation.starBreakdown.task +
      evaluation.starBreakdown.action +
      evaluation.starBreakdown.result;

    // Determine length advisory
    const lengthAdvisory = getLengthAdvisory(speechMetrics, transcript);

    // Determine the question for this turn (from previous turn's nextQuestion or session start)
    let currentQuestion = "Opening question";
    if (previousTurns.length > 0) {
      // The question for this turn was the last turn's nextQuestion
      const lastTurnDoc = turnsSnapshot.docs[turnsSnapshot.docs.length - 1];
      currentQuestion = lastTurnDoc.data().nextQuestion || currentQuestion;
    } else {
      // First turn - get the opening question from the session (if stored)
      currentQuestion = sessionData.openingQuestion || "Tell me about yourself";
    }

    // Store turn in Firestore
    const turnDoc: TurnDocument = {
      question: currentQuestion,
      questionType: evaluation.questionType,
      transcript,
      starScore,
      starBreakdown: evaluation.starBreakdown,
      rewrittenAnswer: null,
      improvements: [],
      speechMetrics,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await sessionRef
      .collection("turns")
      .doc(String(turnNumber))
      .set(turnDoc);

    // Also store the nextQuestion in the turn doc so future turns know what was asked
    await sessionRef
      .collection("turns")
      .doc(String(turnNumber))
      .update({ nextQuestion: evaluation.nextQuestion });

    // Build response
    const response: SubmitResponseResult = {
      starScore,
      starBreakdown: evaluation.starBreakdown,
      missingComponents: evaluation.missingComponents,
      lengthAdvisory,
      nextQuestion: evaluation.nextQuestion,
      questionType: evaluation.questionType,
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    console.error("Error in submitResponse:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    res.status(500).json({
      error: "Failed to evaluate response. Please try again.",
      details: message,
    });
  }
});
