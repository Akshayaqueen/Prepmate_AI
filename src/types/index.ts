/**
 * PrepMate AI — Firestore Data Models and TypeScript Interfaces
 *
 * Collection structure:
 *   users/{userId}
 *   users/{userId}/gamification  (single document)
 *   users/{userId}/sessions/{sessionId}
 *   users/{userId}/sessions/{sessionId}/turns/{turnNumber}
 */

import { Timestamp } from 'firebase/firestore';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Persona {
  Friendly = 'friendly',
  Tough = 'tough',
  Technical = 'technical',
}

export enum Industry {
  Technology = 'technology',
  Finance = 'finance',
  Consulting = 'consulting',
}

export enum Difficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum ConfidenceCategory {
  NeedsWork = 'needs_work',
  Developing = 'developing',
  Competent = 'competent',
  Confident = 'confident',
}

export enum ExperienceLevel {
  Student = 'student',
  Entry = 'entry',
  Mid = 'mid',
}

export enum InterviewTimeline {
  ThisWeek = 'this_week',
  ThisMonth = 'this_month',
  NoDeadline = 'no_deadline',
}

export enum QuestionType {
  Behavioral = 'behavioral',
  Technical = 'technical',
  Situational = 'situational',
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** Firestore document: users/{userId} */
export interface User {
  email: string;
  displayName: string;
  industry: Industry;
  experienceLevel: ExperienceLevel;
  interviewTimeline: InterviewTimeline;
  preferredPersona: Persona;
  notificationTime: string; // "HH:mm"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Firestore document: users/{userId}/gamification (single document) */
export interface GamificationDoc {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string; // "YYYY-MM-DD"
  totalXP: number;
  level: number;
  totalSessions: number;
}

/** Sub-object within Turn documents */
export interface StarBreakdown {
  situation: number; // 0-25
  task: number;      // 0-25
  action: number;    // 0-25
  result: number;    // 0-25
}

/** Sub-object within Turn documents */
export interface SpeechMetrics {
  wpm: number;
  fillerCount: number;
  fillerWords: string[];
  anxietyScore: number;       // 0-100
  durationSeconds: number;
}

/** Firestore document: users/{userId}/sessions/{sessionId} */
export interface Session {
  persona: Persona;
  industry: Industry;
  difficulty: Difficulty;
  confidenceScore: number;
  avgStarScore: number;
  anxietyReading: number;
  fillerCount: number;
  avgWpm: number;
  duration: number; // seconds
  topSuggestions: string[];
  createdAt: Timestamp;
}

/** Firestore document: users/{userId}/sessions/{sessionId}/turns/{turnNumber} */
export interface Turn {
  question: string;
  questionType: QuestionType;
  transcript: string;
  starScore: number;
  starBreakdown: StarBreakdown;
  rewrittenAnswer: string | null;
  improvements: string[];
  speechMetrics: SpeechMetrics;
  timestamp: Timestamp;
}
