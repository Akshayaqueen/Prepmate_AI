/**
 * Achievements / badges system.
 * Each achievement is unlocked based on gamification stats.
 */

import { GamificationDoc } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isUnlocked: (g: GamificationDoc) => boolean;
  progress?: (g: GamificationDoc) => number; // 0-1
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    title: 'First Steps',
    description: 'Complete your first practice session',
    icon: 'foot-print',
    color: '#6C5CE7',
    isUnlocked: (g) => g.totalSessions >= 1,
    progress: (g) => Math.min(g.totalSessions / 1, 1),
  },
  {
    id: 'streak_3',
    title: 'Warming Up',
    description: 'Reach a 3-day streak',
    icon: 'fire',
    color: '#FF6B6B',
    isUnlocked: (g) => g.longestStreak >= 3,
    progress: (g) => Math.min(g.longestStreak / 3, 1),
  },
  {
    id: 'streak_7',
    title: 'On Fire',
    description: 'Reach a 7-day streak',
    icon: 'fire',
    color: '#E17055',
    isUnlocked: (g) => g.longestStreak >= 7,
    progress: (g) => Math.min(g.longestStreak / 7, 1),
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    description: 'Reach a 30-day streak',
    icon: 'trophy',
    color: '#FDCB6E',
    isUnlocked: (g) => g.longestStreak >= 30,
    progress: (g) => Math.min(g.longestStreak / 30, 1),
  },
  {
    id: 'sessions_10',
    title: 'Dedicated',
    description: 'Complete 10 sessions',
    icon: 'medal',
    color: '#00B894',
    isUnlocked: (g) => g.totalSessions >= 10,
    progress: (g) => Math.min(g.totalSessions / 10, 1),
  },
  {
    id: 'sessions_25',
    title: 'Seasoned',
    description: 'Complete 25 sessions',
    icon: 'crown',
    color: '#0984E3',
    isUnlocked: (g) => g.totalSessions >= 25,
    progress: (g) => Math.min(g.totalSessions / 25, 1),
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    icon: 'star-circle',
    color: '#A29BFE',
    isUnlocked: (g) => g.level >= 5,
    progress: (g) => Math.min(g.level / 5, 1),
  },
  {
    id: 'xp_500',
    title: 'XP Hunter',
    description: 'Earn 500 total XP',
    icon: 'lightning-bolt',
    color: '#FD79A8',
    isUnlocked: (g) => g.totalXP >= 500,
    progress: (g) => Math.min(g.totalXP / 500, 1),
  },
];

export function countUnlocked(g: GamificationDoc): number {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(g)).length;
}
