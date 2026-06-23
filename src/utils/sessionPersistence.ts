/**
 * Session Persistence — Auto-save and restore session state
 *
 * Uses AsyncStorage to persist session state so progress isn't lost
 * during app backgrounding, crashes, or network interruptions.
 *
 * Validates: Requirements 1.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_STATE_KEY = '@prepmate/session_state';
const QUEUED_RESPONSES_KEY = '@prepmate/queued_responses';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionState {
  sessionId: string;
  currentQuestion: string;
  turns: any[];
  startTime: number;
  pausedAt: number | null;
}

export interface QueuedResponse {
  id: string;
  sessionId: string;
  transcript: string;
  turnNumber: number;
  speechMetrics: {
    wpm: number;
    fillerCount: number;
    anxietyScore: number;
  };
  queuedAt: number;
}

// ─── Session State Persistence ───────────────────────────────────────────────

/**
 * Save the current session state to local storage.
 * Called automatically when the app is backgrounded or at key checkpoints.
 */
export async function saveSessionState(state: SessionState): Promise<void> {
  try {
    const serialized = JSON.stringify(state);
    await AsyncStorage.setItem(SESSION_STATE_KEY, serialized);
  } catch (error) {
    // Fail silently — persistence is best-effort
    console.warn('[SessionPersistence] Failed to save session state:', error);
  }
}

/**
 * Load previously saved session state from local storage.
 * Returns null if no saved state exists or if data is corrupted.
 */
export async function loadSessionState(): Promise<SessionState | null> {
  try {
    const serialized = await AsyncStorage.getItem(SESSION_STATE_KEY);
    if (!serialized) return null;

    const state: SessionState = JSON.parse(serialized);

    // Validate required fields
    if (!state.sessionId || !state.currentQuestion || !Array.isArray(state.turns)) {
      return null;
    }

    return state;
  } catch (error) {
    console.warn('[SessionPersistence] Failed to load session state:', error);
    return null;
  }
}

/**
 * Clear saved session state (called when session ends normally).
 */
export async function clearSessionState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.warn('[SessionPersistence] Failed to clear session state:', error);
  }
}

// ─── Response Queue (Offline Support) ────────────────────────────────────────

/**
 * Queue a response locally when the network is unavailable.
 * Queued responses will be sent when connectivity returns.
 */
export async function queueResponse(response: QueuedResponse): Promise<void> {
  try {
    const existing = await getQueuedResponses();
    existing.push(response);
    await AsyncStorage.setItem(QUEUED_RESPONSES_KEY, JSON.stringify(existing));
  } catch (error) {
    console.warn('[SessionPersistence] Failed to queue response:', error);
  }
}

/**
 * Retrieve all queued responses waiting to be sent.
 */
export async function getQueuedResponses(): Promise<QueuedResponse[]> {
  try {
    const serialized = await AsyncStorage.getItem(QUEUED_RESPONSES_KEY);
    if (!serialized) return [];
    return JSON.parse(serialized);
  } catch (error) {
    console.warn('[SessionPersistence] Failed to read queued responses:', error);
    return [];
  }
}

/**
 * Remove a specific queued response after it has been successfully sent.
 */
export async function removeQueuedResponse(id: string): Promise<void> {
  try {
    const existing = await getQueuedResponses();
    const filtered = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(QUEUED_RESPONSES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[SessionPersistence] Failed to remove queued response:', error);
  }
}

/**
 * Clear all queued responses (e.g., after successful bulk send).
 */
export async function clearQueuedResponses(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUED_RESPONSES_KEY);
  } catch (error) {
    console.warn('[SessionPersistence] Failed to clear queued responses:', error);
  }
}
