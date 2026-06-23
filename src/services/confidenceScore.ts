import { ConfidenceCategory } from '../types';

/**
 * Calculates the confidence score from anxiety and STAR scores.
 *
 * Formula: round((100 - anxietyScore) × 0.6 + starScore × 0.4)
 *
 * Speech quality (inverse of anxiety) is weighted at 60%,
 * content quality (STAR score) is weighted at 40%.
 */
export function calculateConfidenceScore(anxietyScore: number, starScore: number): number {
  const speechQuality = 100 - anxietyScore;
  const confidence = speechQuality * 0.6 + starScore * 0.4;
  return Math.round(confidence);
}

/**
 * Maps a confidence score (0-100) to its category.
 *
 * Categories:
 * - needs_work: 0-39
 * - developing: 40-59
 * - competent: 60-79
 * - confident: 80-100
 */
export function getConfidenceCategory(score: number): ConfidenceCategory {
  if (score >= 80) return ConfidenceCategory.Confident;
  if (score >= 60) return ConfidenceCategory.Competent;
  if (score >= 40) return ConfidenceCategory.Developing;
  return ConfidenceCategory.NeedsWork;
}
