/**
 * Gamification Firestore Integration
 *
 * Handles reading and writing gamification data to Firestore,
 * and orchestrates session completion logic (streak + XP + level).
 * Requirements: 7.1, 7.2, 7.3
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GamificationDoc, Difficulty } from '../types';
import { updateStreak, awardXP, calculateLevel, checkMilestone } from './gamification';

/** Default gamification document for new users */
const DEFAULT_GAMIFICATION: GamificationDoc = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  totalXP: 0,
  level: 1,
  totalSessions: 0,
};

/**
 * Loads a user's gamification data from Firestore.
 * Returns null if the document doesn't exist.
 *
 * Reads from: users/{userId}/gamification/stats
 */
export async function loadGamification(userId: string): Promise<GamificationDoc | null> {
  const docRef = doc(db, 'users', userId, 'gamification', 'stats');
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as GamificationDoc;
}

/**
 * Saves updated gamification data to Firestore.
 * Uses setDoc with merge to create or overwrite the document.
 *
 * Writes to: users/{userId}/gamification/stats
 */
export async function saveGamification(userId: string, data: GamificationDoc): Promise<void> {
  const docRef = doc(db, 'users', userId, 'gamification', 'stats');
  await setDoc(docRef, data);
}

/** Result of onSessionComplete including any milestone reached */
export interface SessionCompleteResult {
  gamification: GamificationDoc;
  milestone: 'week' | 'month' | null;
}

/**
 * Orchestrates the full gamification update after a practice session completes.
 *
 * Steps:
 * 1. Load current gamification data (create default if doesn't exist)
 * 2. Update streak with today's date
 * 3. Award XP based on difficulty and update totalXP
 * 4. Recalculate level from new totalXP
 * 5. Increment totalSessions
 * 6. Check for milestone (week/month)
 * 7. Save and return the updated doc with milestone info
 */
export async function onSessionComplete(userId: string, difficulty: Difficulty): Promise<SessionCompleteResult> {
  // 1. Load current data or create default
  const current = await loadGamification(userId) ?? { ...DEFAULT_GAMIFICATION };

  // 2. Update streak with today's date
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const afterStreak = updateStreak(current, today);

  // 3. Award XP and update totalXP
  const xpEarned = awardXP(difficulty);
  const newTotalXP = afterStreak.totalXP + xpEarned;

  // 4. Recalculate level from new totalXP
  const newLevel = calculateLevel(newTotalXP);

  // 5. Increment totalSessions
  const updated: GamificationDoc = {
    ...afterStreak,
    totalXP: newTotalXP,
    level: newLevel,
    totalSessions: afterStreak.totalSessions + 1,
  };

  // 6. Check for milestone celebration
  const milestone = checkMilestone(updated.currentStreak);

  // 7. Save and return
  await saveGamification(userId, updated);

  return { gamification: updated, milestone };
}
