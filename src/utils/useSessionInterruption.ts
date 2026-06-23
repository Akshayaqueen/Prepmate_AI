/**
 * Session Interruption Handler — Manage app lifecycle events during sessions
 *
 * Handles app backgrounding (pause timer, auto-save state) and
 * foregrounding (show resume dialog, restore state).
 *
 * Validates: Requirements 1.5
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  SessionState,
} from './sessionPersistence';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionInterruptionOptions {
  /** Whether a session is currently active */
  isSessionActive: boolean;
  /** Current session ID */
  sessionId: string | null;
  /** Current question being displayed */
  currentQuestion: string | null;
  /** Turns completed so far */
  turns: any[];
  /** Session start time (ms timestamp) */
  startTime: number | null;
  /** Called when session is paused (app backgrounded) */
  onPause?: () => void;
  /** Called when session resumes (app foregrounded) */
  onResume?: () => void;
}

export interface SessionInterruptionResult {
  /** Whether the session is currently paused due to backgrounding */
  isPaused: boolean;
  /** Whether a resume dialog should be shown */
  showResumeDialog: boolean;
  /** Saved state available for restoration */
  savedState: SessionState | null;
  /** Call to resume the session (dismiss dialog) */
  handleResume: () => void;
  /** Call to end the session (dismiss dialog, clear state) */
  handleEnd: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Manages session state during app lifecycle interruptions.
 *
 * - When the app backgrounds: pauses the timer, auto-saves state
 * - When the app foregrounds: offers to resume or end the session
 */
export function useSessionInterruption(
  options: SessionInterruptionOptions
): SessionInterruptionResult {
  const {
    isSessionActive,
    sessionId,
    currentQuestion,
    turns,
    startTime,
    onPause,
    onResume,
  } = options;

  const [isPaused, setIsPaused] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedState, setSavedState] = useState<SessionState | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Auto-save on background
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      const prevState = appStateRef.current;

      if (
        prevState === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App is going to background — pause and save
        if (isSessionActive && sessionId && currentQuestion) {
          const state: SessionState = {
            sessionId,
            currentQuestion,
            turns,
            startTime: startTime ?? Date.now(),
            pausedAt: Date.now(),
          };
          await saveSessionState(state);
          setIsPaused(true);
          onPause?.();
        }
      } else if (
        (prevState === 'background' || prevState === 'inactive') &&
        nextAppState === 'active'
      ) {
        // App is coming back to foreground
        if (isPaused && isSessionActive) {
          setShowResumeDialog(true);
          onResume?.();
        }
      }

      appStateRef.current = nextAppState;
    },
    [isSessionActive, sessionId, currentQuestion, turns, startTime, isPaused, onPause, onResume]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  // Check for saved state on mount (handles app crash recovery)
  useEffect(() => {
    async function checkSavedState() {
      const state = await loadSessionState();
      if (state && !isSessionActive) {
        setSavedState(state);
        setShowResumeDialog(true);
      }
    }
    checkSavedState();
  }, [isSessionActive]);

  const handleResume = useCallback(() => {
    setShowResumeDialog(false);
    setIsPaused(false);
  }, []);

  const handleEnd = useCallback(async () => {
    setShowResumeDialog(false);
    setIsPaused(false);
    setSavedState(null);
    await clearSessionState();
  }, []);

  return {
    isPaused,
    showResumeDialog,
    savedState,
    handleResume,
    handleEnd,
  };
}
