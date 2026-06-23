import { StarBreakdown } from '../types';

/**
 * Calculates the total STAR score by summing all four components.
 * Each component (situation, task, action, result) contributes 0-25 points.
 * Total range: 0-100.
 */
export function calculateTotalStarScore(breakdown: StarBreakdown): number {
  return breakdown.situation + breakdown.task + breakdown.action + breakdown.result;
}

/**
 * Returns a length advisory based on response duration.
 * - "too_short" if duration < 30 seconds
 * - "too_long" if duration > 180 seconds (3 minutes)
 * - null if duration is within acceptable range
 */
export function getLengthAdvisory(durationSeconds: number): 'too_short' | 'too_long' | null {
  if (durationSeconds < 30) {
    return 'too_short';
  }
  if (durationSeconds > 180) {
    return 'too_long';
  }
  return null;
}
