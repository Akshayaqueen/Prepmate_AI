/**
 * Speech Analyzer Module (On-Device)
 *
 * Pure text analysis on transcripts returned by React Native Voice.
 * No audio processing — just filler word detection, pace calculation,
 * and anxiety scoring.
 *
 * Requirements: 3.1, 3.2
 */

import { SpeechMetrics } from '../types';

/** Filler words/phrases to detect (case-insensitive) */
export const FILLER_WORDS: readonly string[] = [
  'um',
  'uh',
  'like',
  'you know',
  'basically',
  'actually',
];

/** Ideal speaking pace (words per minute) */
const IDEAL_WPM = 140;

/** Deviation from ideal WPM that maps to max anxiety contribution */
const WPM_RANGE = 40;

/** Filler rate (per minute) that maps to max anxiety contribution */
const MAX_FILLER_RATE = 10;

/**
 * Count occurrences of filler words/phrases in a transcript (case-insensitive).
 * Single-word fillers use word boundary matching to avoid false positives
 * (e.g. "like" won't match inside "likely").
 * Multi-word fillers (e.g. "you know") are matched as whole phrases.
 */
function countFillers(transcript: string): { fillerCount: number; fillerWords: string[] } {
  const lowerTranscript = transcript.toLowerCase();
  const detectedFillers: string[] = [];

  for (const filler of FILLER_WORDS) {
    // Build a regex with word boundaries for accurate matching
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = lowerTranscript.match(pattern);

    if (matches) {
      for (const _ of matches) {
        detectedFillers.push(filler);
      }
    }
  }

  return {
    fillerCount: detectedFillers.length,
    fillerWords: detectedFillers,
  };
}

/**
 * Count words in a transcript by splitting on whitespace.
 */
function countWords(transcript: string): number {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Calculate the anxiety score from filler count, word count, and duration.
 *
 * Formula:
 *   fillerRate = fillerCount / durationMinutes
 *   fillerNormalized = min(fillerRate / 10, 1.0)
 *   wpm = wordCount / durationMinutes
 *   paceDeviation = |wpm - 140| / 40
 *   paceNormalized = min(paceDeviation, 1.0)
 *   anxiety = round((fillerNormalized * 0.6 + paceNormalized * 0.4) * 100)
 *
 * Output clamped to [0, 100].
 */
function calculateAnxietyScore(
  fillerCount: number,
  wordCount: number,
  durationSeconds: number
): number {
  const durationMinutes = durationSeconds / 60;

  if (durationMinutes <= 0) return 0;

  // Filler rate normalized to 0-1 (10+ fillers/min = 1.0)
  const fillerRate = fillerCount / durationMinutes;
  const fillerNormalized = Math.min(fillerRate / MAX_FILLER_RATE, 1.0);

  // Pace deviation normalized to 0-1
  const wpm = wordCount / durationMinutes;
  const paceDeviation = Math.abs(wpm - IDEAL_WPM) / WPM_RANGE;
  const paceNormalized = Math.min(paceDeviation, 1.0);

  // Composite anxiety score
  const anxiety = Math.round((fillerNormalized * 0.6 + paceNormalized * 0.4) * 100);

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, anxiety));
}

/**
 * Calculate the anxiety score from filler count, word count, and duration in minutes.
 *
 * This is the public exported version that accepts durationMinutes directly.
 *
 * Formula:
 *   fillerRate = fillerCount / durationMinutes
 *   fillerNormalized = min(fillerRate / 10, 1.0)
 *   wpm = wordCount / durationMinutes
 *   paceNormalized = min(|wpm - 140| / 40, 1.0)
 *   result = round((fillerNormalized * 0.6 + paceNormalized * 0.4) * 100)
 *
 * Output clamped to [0, 100].
 *
 * @param fillerCount - Number of filler words detected
 * @param wordCount - Total word count in the transcript
 * @param durationMinutes - Duration of speech in minutes
 * @returns Anxiety score in [0, 100]
 *
 * Requirements: 3.5
 */
export function calculateAnxiety(fillerCount: number, wordCount: number, durationMinutes: number): number {
  if (durationMinutes <= 0) return 0;

  // Filler rate normalized to 0-1 (10+ fillers/min = 1.0)
  const fillerRate = fillerCount / durationMinutes;
  const fillerNormalized = Math.min(fillerRate / MAX_FILLER_RATE, 1.0);

  // Pace deviation normalized to 0-1
  const wpm = wordCount / durationMinutes;
  const paceDeviation = Math.abs(wpm - IDEAL_WPM) / WPM_RANGE;
  const paceNormalized = Math.min(paceDeviation, 1.0);

  // Composite anxiety score
  const anxiety = Math.round((fillerNormalized * 0.6 + paceNormalized * 0.4) * 100);

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, anxiety));
}

/**
 * Determine whether a filler word alert should be shown to the user.
 *
 * Returns true if the filler rate exceeds 5 fillers per minute.
 *
 * @param fillerCount - Number of filler words detected
 * @param durationMinutes - Duration of speech in minutes
 * @returns true if fillerCount / durationMinutes > 5
 *
 * Requirements: 3.3
 */
export function shouldShowFillerAlert(fillerCount: number, durationMinutes: number): boolean {
  if (durationMinutes <= 0) return false;
  return fillerCount / durationMinutes > 5;
}

/**
 * Determine whether a pacing alert should be shown to the user.
 *
 * Returns true if speaking pace is below 100 WPM or above 180 WPM.
 *
 * @param wpm - Words per minute
 * @returns true if wpm < 100 or wpm > 180
 *
 * Requirements: 3.4
 */
export function shouldShowPacingAlert(wpm: number): boolean {
  return wpm < 100 || wpm > 180;
}

/**
 * Session-level aggregated speech summary.
 * Requirements: 3.6
 */
export interface SessionSpeechSummary {
  totalFillerCount: number;
  avgWpm: number;
  finalAnxiety: number;
}

/**
 * Aggregate per-turn speech metrics into a session-level summary.
 *
 * - Total filler count: sum of all turn filler counts
 * - Average WPM: mean of all turn WPMs
 * - Final anxiety: calculated from aggregate metrics (total fillers, total words, total duration)
 *   using the calculateAnxiety function
 *
 * Returns zeroes for an empty array.
 *
 * @param turns - Array of per-turn SpeechMetrics
 * @returns SessionSpeechSummary with aggregated values
 *
 * Requirements: 3.6
 */
export function aggregateSessionMetrics(turns: SpeechMetrics[]): SessionSpeechSummary {
  if (turns.length === 0) {
    return { totalFillerCount: 0, avgWpm: 0, finalAnxiety: 0 };
  }

  const totalFillerCount = turns.reduce((sum, t) => sum + t.fillerCount, 0);
  const avgWpm = turns.reduce((sum, t) => sum + t.wpm, 0) / turns.length;

  // Derive total words and total duration from each turn's WPM and durationSeconds
  const totalDurationSeconds = turns.reduce((sum, t) => sum + t.durationSeconds, 0);
  const totalDurationMinutes = totalDurationSeconds / 60;

  // Reconstruct total word count from each turn: words = wpm * (durationSeconds / 60)
  const totalWords = turns.reduce((sum, t) => sum + t.wpm * (t.durationSeconds / 60), 0);

  const finalAnxiety = calculateAnxiety(totalFillerCount, totalWords, totalDurationMinutes);

  return { totalFillerCount, avgWpm, finalAnxiety };
}

/**
 * Analyze a single turn's transcript and produce speech metrics.
 *
 * @param transcript - The speech-to-text transcript for one turn
 * @param durationSeconds - Duration of the turn in seconds
 * @returns SpeechMetrics object with wpm, fillerCount, fillerWords, anxietyScore, durationSeconds
 */
export function analyzeTurn(transcript: string, durationSeconds: number): SpeechMetrics {
  const wordCount = countWords(transcript);
  const durationMinutes = durationSeconds / 60;

  // Calculate WPM
  const wpm = durationMinutes > 0 ? wordCount / durationMinutes : 0;

  // Detect filler words
  const { fillerCount, fillerWords } = countFillers(transcript);

  // Calculate anxiety score
  const anxietyScore = calculateAnxietyScore(fillerCount, wordCount, durationSeconds);

  return {
    wpm,
    fillerCount,
    fillerWords,
    anxietyScore,
    durationSeconds,
  };
}
