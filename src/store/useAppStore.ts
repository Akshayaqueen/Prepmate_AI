/**
 * PrepMate AI — Zustand State Management Store
 *
 * Slices: auth, session, gamification, ui
 * Validates: Requirements 1.3, 6.5
 */

import { create, StateCreator } from 'zustand';
import {
  User,
  Turn,
  GamificationDoc,
  SpeechMetrics,
  Persona,
  Industry,
  Difficulty,
} from '../types';

// ─── Slice Interfaces ────────────────────────────────────────────────────────

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export interface SessionSlice {
  currentSessionId: string | null;
  currentQuestion: string | null;
  turns: Turn[];
  isRecording: boolean;
  liveSpeechMetrics: Partial<SpeechMetrics> | null;
  startSession: (params: {
    persona: Persona;
    industry: Industry;
    difficulty: Difficulty;
  }) => void;
  submitResponse: (turn: Turn) => void;
  endSession: () => void;
  setRecording: (isRecording: boolean) => void;
  setLiveSpeechMetrics: (metrics: Partial<SpeechMetrics> | null) => void;
}

export interface GamificationSlice {
  gamification: GamificationDoc | null;
  updateStreak: (today: string) => void;
  loadGamification: () => void;
  setGamification: (data: GamificationDoc) => void;
}

export interface UISlice {
  isLoading: boolean;
  error: string | null;
  selectedRoleId: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRole: (roleId: string) => void;
}

// ─── Combined Store Type ─────────────────────────────────────────────────────

export type AppState = AuthSlice & SessionSlice & GamificationSlice & UISlice;

// ─── Slice Creators ──────────────────────────────────────────────────────────

const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
});

const createSessionSlice: StateCreator<AppState, [], [], SessionSlice> = (set) => ({
  currentSessionId: null,
  currentQuestion: null,
  turns: [],
  isRecording: false,
  liveSpeechMetrics: null,

  startSession: (_params) => {
    // Initiates a new session — the actual API call and sessionId assignment
    // happen in the service layer; this prepares local state.
    set({
      currentSessionId: null,
      currentQuestion: null,
      turns: [],
      isRecording: false,
      liveSpeechMetrics: null,
      isLoading: true,
      error: null,
    });
  },

  submitResponse: (turn) => {
    set((state) => ({
      turns: [...state.turns, turn],
      isLoading: true,
      error: null,
    }));
  },

  endSession: () => {
    set({
      currentSessionId: null,
      currentQuestion: null,
      turns: [],
      isRecording: false,
      liveSpeechMetrics: null,
      isLoading: false,
    });
  },

  setRecording: (isRecording) => set({ isRecording }),

  setLiveSpeechMetrics: (metrics) => set({ liveSpeechMetrics: metrics }),
});

const createGamificationSlice: StateCreator<AppState, [], [], GamificationSlice> = (set, get) => ({
  gamification: null,

  updateStreak: (today) => {
    const current = get().gamification;
    if (!current) return;

    const lastDate = current.lastPracticeDate;

    // Same day — no change
    if (lastDate === today) return;

    // Calculate yesterday using UTC to avoid timezone shifts
    const [year, month, day] = today.split('-').map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (lastDate === yesterday) {
      // Consecutive day — increment streak
      const newStreak = current.currentStreak + 1;
      set({
        gamification: {
          ...current,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, current.longestStreak),
          lastPracticeDate: today,
        },
      });
    } else {
      // Missed a day — reset streak to 1
      set({
        gamification: {
          ...current,
          currentStreak: 1,
          longestStreak: current.longestStreak, // never decrease
          lastPracticeDate: today,
        },
      });
    }
  },

  loadGamification: () => {
    // Placeholder — actual Firestore fetch happens in the service layer.
    // This action signals that loading is in progress.
    set({ isLoading: true, error: null });
  },

  setGamification: (data) => set({ gamification: data, isLoading: false }),
});

const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  isLoading: false,
  error: null,
  selectedRoleId: 'sde',
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),
  setRole: (roleId) => set({ selectedRoleId: roleId }),
});

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()((...args) => ({
  ...createAuthSlice(...args),
  ...createSessionSlice(...args),
  ...createGamificationSlice(...args),
  ...createUISlice(...args),
}));
