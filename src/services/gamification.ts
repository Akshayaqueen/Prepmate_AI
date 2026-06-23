/**
 * Gamification — Streak management, XP award, and level calculation
 *
 * Handles streak updates based on practice dates, XP awards per difficulty,
 * and level computation from cumulative XP.
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import { Difficulty, GamificationDoc } from '../types';

/**
 * Returns the date string (YYYY-MM-DD) for the day before the given date.
 */
export function getYesterday(today: string): string {
  const date = new Date(today + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Updates the streak in a GamificationDoc based on today's practice date.
 *
 * - Same day as lastPracticeDate → no change
 * - Yesterday → increment currentStreak (and longestStreak if needed)
 * - Any other (missed day) → reset currentStreak to 1
 *
 * longestStreak never decreases.
 */
export function updateStreak(
  gamification: GamificationDoc,
  today: string
): GamificationDoc {
  const lastDate = gamification.lastPracticeDate;

  if (lastDate === today) {
    // Already practiced today — no streak change
    return gamification;
  }

  const yesterday = getYesterday(today);

  if (lastDate === yesterday) {
    // Consecutive day — increment streak
    const newStreak = gamification.currentStreak + 1;
    return {
      ...gamification,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, gamification.longestStreak),
      lastPracticeDate: today,
    };
  }

  // Missed a day — reset streak
  return {
    ...gamification,
    currentStreak: 1,
    lastPracticeDate: today,
  };
}


/**
 * Awards XP based on session difficulty.
 *
 * - Beginner: 10 XP
 * - Intermediate: 20 XP
 * - Advanced: 30 XP
 *
 * Requirements: 7.2
 */
export function awardXP(difficulty: Difficulty): number {
  const xpMap: Record<Difficulty, number> = {
    [Difficulty.Beginner]: 10,
    [Difficulty.Intermediate]: 20,
    [Difficulty.Advanced]: 30,
  };
  return xpMap[difficulty];
}

/**
 * Calculates user level from cumulative XP.
 *
 * Formula: floor(totalXP / 100) + 1
 *
 * Requirements: 7.3
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 100) + 1;
}

/**
 * Checks if the current streak has reached a milestone.
 *
 * Returns 'week' at streak = 7, 'month' at streak = 30, null otherwise.
 *
 * Requirements: 7.4
 */
export function checkMilestone(streak: number): 'week' | 'month' | null {
  if (streak === 30) return 'month';
  if (streak === 7) return 'week';
  return null;
}
