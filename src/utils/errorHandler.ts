/**
 * Error handling utilities for PrepMate AI
 * Provides retry logic, error classification, and user-friendly error messages.
 * Requirements: 1.5
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number) => void;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1 second

/**
 * Wraps an async function with retry logic using exponential backoff.
 * Delays: 1s, 2s, 4s (baseDelay * 2^attempt)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.baseDelay ?? DEFAULT_BASE_DELAY;
  const onRetry = options?.onRetry;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        onRetry?.(attempt + 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Maps error types to user-friendly messages for display in the app.
 */
export function getErrorMessage(error: unknown): string {
  if (isTimeoutError(error)) {
    return 'Taking longer than usual...';
  }

  if (isNetworkError(error)) {
    return 'AI is unavailable. Please try again.';
  }

  if (isEmptyTranscriptError(error)) {
    return "We didn't catch that. Please try speaking again.";
  }

  if (isFirestoreError(error)) {
    return 'Will save when connection restores.';
  }

  if (error instanceof Error) {
    // Rate limiting
    if ('status' in error && (error as any).status === 429) {
      return 'Too many requests. Please wait a moment.';
    }
    // Generic server errors
    if ('status' in error) {
      const status = (error as any).status;
      if (status >= 400 && status < 600) {
        return 'AI is unavailable. Please try again.';
      }
    }
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Checks if an error is network-related (connection issues, DNS failures, etc.)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Network request failed') {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const networkIndicators = [
      'network',
      'fetch failed',
      'failed to fetch',
      'net::',
      'econnrefused',
      'econnreset',
      'enotfound',
      'enetunreach',
      'socket hang up',
    ];
    return networkIndicators.some((indicator) => message.includes(indicator));
  }

  return false;
}

/**
 * Checks if an error is a timeout error.
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const timeoutIndicators = ['timeout', 'timed out', 'aborted', 'deadline exceeded'];
    return timeoutIndicators.some((indicator) => message.includes(indicator));
  }

  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as any).code === 'ETIMEDOUT'
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if an error is related to an empty transcript from speech-to-text.
 */
export function isEmptyTranscriptError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('empty transcript') || message.includes('no speech detected');
  }
  return false;
}

/**
 * Checks if an error is a Firestore-related error.
 */
export function isFirestoreError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const firestoreIndicators = [
      'firestore',
      'firebase',
      'permission-denied',
      'unavailable',
      'deadline-exceeded',
    ];
    return firestoreIndicators.some((indicator) => message.includes(indicator));
  }
  return false;
}

/**
 * Retries a Firestore write operation up to 2 times, then caches locally.
 * Returns true if the write succeeded, false if it was cached.
 */
export async function withFirestoreRetry<T>(
  writeFn: () => Promise<T>,
  onCacheFallback?: () => void
): Promise<{ success: boolean; result?: T }> {
  try {
    const result = await withRetry(writeFn, { maxRetries: 2, baseDelay: 500 });
    return { success: true, result };
  } catch {
    onCacheFallback?.();
    return { success: false };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
