import { useAppStore } from '../../src/store/useAppStore';
import {
  Persona,
  Industry,
  Difficulty,
  ExperienceLevel,
  InterviewTimeline,
  QuestionType,
} from '../../src/types';
import { Timestamp } from 'firebase/firestore';

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    user: null,
    isAuthenticated: false,
    currentSessionId: null,
    currentQuestion: null,
    turns: [],
    isRecording: false,
    liveSpeechMetrics: null,
    gamification: null,
    isLoading: false,
    error: null,
  });
});

// ─── Auth Slice ──────────────────────────────────────────────────────────────

describe('Auth Slice', () => {
  const mockUser = {
    email: 'test@example.com',
    displayName: 'Test User',
    industry: Industry.Technology,
    experienceLevel: ExperienceLevel.Student,
    interviewTimeline: InterviewTimeline.ThisMonth,
    preferredPersona: Persona.Friendly,
    notificationTime: '09:00',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  it('starts with no authenticated user', () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setUser sets user and marks authenticated', () => {
    useAppStore.getState().setUser(mockUser);
    const state = useAppStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clearUser removes user and marks unauthenticated', () => {
    useAppStore.getState().setUser(mockUser);
    useAppStore.getState().clearUser();
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

// ─── Session Slice ───────────────────────────────────────────────────────────

describe('Session Slice', () => {
  const mockTurn = {
    question: 'Tell me about a time you led a team.',
    questionType: QuestionType.Behavioral,
    transcript: 'I led a team of 5 developers...',
    starScore: 75,
    starBreakdown: { situation: 20, task: 18, action: 22, result: 15 },
    rewrittenAnswer: null,
    improvements: ['Add quantified results'],
    speechMetrics: {
      wpm: 140,
      fillerCount: 2,
      fillerWords: ['um', 'like'],
      anxietyScore: 30,
      durationSeconds: 90,
    },
    timestamp: Timestamp.now(),
  };

  it('startSession resets session state and sets loading', () => {
    useAppStore.getState().startSession({
      persona: Persona.Tough,
      industry: Industry.Finance,
      difficulty: Difficulty.Advanced,
    });
    const state = useAppStore.getState();
    expect(state.currentSessionId).toBeNull();
    expect(state.currentQuestion).toBeNull();
    expect(state.turns).toEqual([]);
    expect(state.isRecording).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('submitResponse appends turn and sets loading', () => {
    useAppStore.getState().submitResponse(mockTurn);
    const state = useAppStore.getState();
    expect(state.turns).toHaveLength(1);
    expect(state.turns[0]).toEqual(mockTurn);
    expect(state.isLoading).toBe(true);
  });

  it('endSession clears all session state', () => {
    useAppStore.getState().submitResponse(mockTurn);
    useAppStore.getState().endSession();
    const state = useAppStore.getState();
    expect(state.currentSessionId).toBeNull();
    expect(state.currentQuestion).toBeNull();
    expect(state.turns).toEqual([]);
    expect(state.isRecording).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setRecording toggles recording state', () => {
    useAppStore.getState().setRecording(true);
    expect(useAppStore.getState().isRecording).toBe(true);
    useAppStore.getState().setRecording(false);
    expect(useAppStore.getState().isRecording).toBe(false);
  });

  it('setLiveSpeechMetrics updates live metrics', () => {
    const metrics = { wpm: 150, fillerCount: 3 };
    useAppStore.getState().setLiveSpeechMetrics(metrics);
    expect(useAppStore.getState().liveSpeechMetrics).toEqual(metrics);
  });
});

// ─── Gamification Slice ──────────────────────────────────────────────────────

describe('Gamification Slice', () => {
  const baseGamification = {
    currentStreak: 3,
    longestStreak: 10,
    lastPracticeDate: '2024-01-15',
    totalXP: 200,
    level: 3,
    totalSessions: 12,
  };

  it('setGamification stores data and clears loading', () => {
    useAppStore.getState().setGamification(baseGamification);
    const state = useAppStore.getState();
    expect(state.gamification).toEqual(baseGamification);
    expect(state.isLoading).toBe(false);
  });

  it('updateStreak does nothing if same day', () => {
    useAppStore.getState().setGamification(baseGamification);
    useAppStore.getState().updateStreak('2024-01-15');
    const state = useAppStore.getState();
    expect(state.gamification!.currentStreak).toBe(3);
    expect(state.gamification!.lastPracticeDate).toBe('2024-01-15');
  });

  it('updateStreak increments on consecutive day', () => {
    useAppStore.getState().setGamification(baseGamification);
    useAppStore.getState().updateStreak('2024-01-16');
    const state = useAppStore.getState();
    expect(state.gamification!.currentStreak).toBe(4);
    expect(state.gamification!.longestStreak).toBe(10); // unchanged, still lower
    expect(state.gamification!.lastPracticeDate).toBe('2024-01-16');
  });

  it('updateStreak updates longestStreak when exceeded', () => {
    const highStreak = { ...baseGamification, currentStreak: 10, longestStreak: 10 };
    useAppStore.getState().setGamification(highStreak);
    useAppStore.getState().updateStreak('2024-01-16');
    const state = useAppStore.getState();
    expect(state.gamification!.currentStreak).toBe(11);
    expect(state.gamification!.longestStreak).toBe(11);
  });

  it('updateStreak resets on missed day', () => {
    useAppStore.getState().setGamification(baseGamification);
    useAppStore.getState().updateStreak('2024-01-18'); // skipped Jan 16, 17
    const state = useAppStore.getState();
    expect(state.gamification!.currentStreak).toBe(1);
    expect(state.gamification!.longestStreak).toBe(10); // preserved
    expect(state.gamification!.lastPracticeDate).toBe('2024-01-18');
  });

  it('updateStreak does nothing if gamification is null', () => {
    useAppStore.getState().updateStreak('2024-01-18');
    expect(useAppStore.getState().gamification).toBeNull();
  });

  it('loadGamification sets loading state', () => {
    useAppStore.getState().loadGamification();
    expect(useAppStore.getState().isLoading).toBe(true);
  });
});

// ─── UI Slice ────────────────────────────────────────────────────────────────

describe('UI Slice', () => {
  it('starts with no loading or error', () => {
    const state = useAppStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setLoading updates loading state', () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().isLoading).toBe(true);
  });

  it('setError sets error and clears loading', () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError('Something went wrong');
    const state = useAppStore.getState();
    expect(state.error).toBe('Something went wrong');
    expect(state.isLoading).toBe(false);
  });

  it('clearError removes error message', () => {
    useAppStore.getState().setError('Oops');
    useAppStore.getState().clearError();
    expect(useAppStore.getState().error).toBeNull();
  });
});
