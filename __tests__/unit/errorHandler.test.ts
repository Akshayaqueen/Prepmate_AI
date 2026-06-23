import {
  withRetry,
  getErrorMessage,
  isNetworkError,
  isTimeoutError,
  isEmptyTranscriptError,
  isFirestoreError,
  withFirestoreRetry,
} from '../../src/utils/errorHandler';

describe('errorHandler', () => {
  describe('withRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns the result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries up to maxRetries times on failure', async () => {
      jest.useRealTimers();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValueOnce(new Error('fail 3'))
        .mockRejectedValueOnce(new Error('fail 4'));

      await expect(
        withRetry(fn, { maxRetries: 3, baseDelay: 1 })
      ).rejects.toThrow('fail 4');
      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });

    it('succeeds on retry after initial failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { baseDelay: 100 });

      await jest.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback with attempt number', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, { baseDelay: 100, onRetry });

      await jest.advanceTimersByTimeAsync(100);
      await promise;

      expect(onRetry).toHaveBeenCalledWith(1);
    });

    it('uses exponential backoff delays', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const start = Date.now();
      const promise = withRetry(fn, { baseDelay: 1000 });

      // First retry: 1000ms (1000 * 2^0)
      await jest.advanceTimersByTimeAsync(1000);
      // Second retry: 2000ms (1000 * 2^1)
      await jest.advanceTimersByTimeAsync(2000);

      await promise;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('defaults to 3 retries', async () => {
      jest.useRealTimers();
      const fn = jest.fn().mockRejectedValue(new Error('always fails'));

      await expect(withRetry(fn, { baseDelay: 1 })).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
  });

  describe('getErrorMessage', () => {
    it('returns timeout message for timeout errors', () => {
      const error = new Error('Request timeout');
      expect(getErrorMessage(error)).toBe('Taking longer than usual...');
    });

    it('returns network error message for network errors', () => {
      const error = new TypeError('Network request failed');
      expect(getErrorMessage(error)).toBe('AI is unavailable. Please try again.');
    });

    it('returns empty transcript message for empty transcript errors', () => {
      const error = new Error('Empty transcript returned');
      expect(getErrorMessage(error)).toBe("We didn't catch that. Please try speaking again.");
    });

    it('returns Firestore error message for Firestore errors', () => {
      const error = new Error('Firestore write failed');
      expect(getErrorMessage(error)).toBe('Will save when connection restores.');
    });

    it('returns rate limiting message for 429 errors', () => {
      const error = Object.assign(new Error('Rate limited'), { status: 429 });
      expect(getErrorMessage(error)).toBe('Too many requests. Please wait a moment.');
    });

    it('returns AI unavailable for server errors (5xx)', () => {
      const error = Object.assign(new Error('Internal Server Error'), { status: 500 });
      expect(getErrorMessage(error)).toBe('AI is unavailable. Please try again.');
    });

    it('returns generic message for unknown errors', () => {
      expect(getErrorMessage('something')).toBe('Something went wrong. Please try again.');
    });
  });

  describe('isNetworkError', () => {
    it('returns true for TypeError "Network request failed"', () => {
      expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
    });

    it('returns true for fetch failed errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    });

    it('returns true for ECONNREFUSED', () => {
      expect(isNetworkError(new Error('connect ECONNREFUSED 127.0.0.1:443'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Some random error'))).toBe(false);
    });

    it('returns false for non-Error values', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(42)).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('returns true for timeout messages', () => {
      expect(isTimeoutError(new Error('Request timeout'))).toBe(true);
      expect(isTimeoutError(new Error('Connection timed out'))).toBe(true);
      expect(isTimeoutError(new Error('Request aborted'))).toBe(true);
      expect(isTimeoutError(new Error('Deadline exceeded'))).toBe(true);
    });

    it('returns true for ETIMEDOUT code', () => {
      const error = { code: 'ETIMEDOUT' };
      expect(isTimeoutError(error)).toBe(true);
    });

    it('returns false for non-timeout errors', () => {
      expect(isTimeoutError(new Error('Some error'))).toBe(false);
    });

    it('returns false for non-Error values', () => {
      expect(isTimeoutError(null)).toBe(false);
      expect(isTimeoutError(undefined)).toBe(false);
    });
  });

  describe('isEmptyTranscriptError', () => {
    it('returns true for empty transcript errors', () => {
      expect(isEmptyTranscriptError(new Error('Empty transcript returned'))).toBe(true);
      expect(isEmptyTranscriptError(new Error('No speech detected'))).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isEmptyTranscriptError(new Error('Some error'))).toBe(false);
    });
  });

  describe('isFirestoreError', () => {
    it('returns true for Firestore errors', () => {
      expect(isFirestoreError(new Error('Firestore write failed'))).toBe(true);
      expect(isFirestoreError(new Error('Firebase error'))).toBe(true);
      expect(isFirestoreError(new Error('permission-denied'))).toBe(true);
    });

    it('returns false for non-Firestore errors', () => {
      expect(isFirestoreError(new Error('Random error'))).toBe(false);
    });
  });

  describe('withFirestoreRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns success true when write succeeds', async () => {
      const writeFn = jest.fn().mockResolvedValue('data');
      const result = await withFirestoreRetry(writeFn);
      expect(result).toEqual({ success: true, result: 'data' });
    });

    it('retries twice then calls cache fallback on failure', async () => {
      const writeFn = jest.fn().mockRejectedValue(new Error('write failed'));
      const onCacheFallback = jest.fn();

      const promise = withFirestoreRetry(writeFn, onCacheFallback);

      await jest.advanceTimersByTimeAsync(500);  // retry 1
      await jest.advanceTimersByTimeAsync(1000); // retry 2

      const result = await promise;
      expect(result).toEqual({ success: false });
      expect(onCacheFallback).toHaveBeenCalled();
      expect(writeFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });
});
