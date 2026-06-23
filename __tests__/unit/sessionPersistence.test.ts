import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  queueResponse,
  getQueuedResponses,
  removeQueuedResponse,
  clearQueuedResponses,
  SessionState,
  QueuedResponse,
} from '../../src/utils/sessionPersistence';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('sessionPersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSessionState', () => {
    it('saves session state to AsyncStorage', async () => {
      const state: SessionState = {
        sessionId: 'session-123',
        currentQuestion: 'Tell me about yourself',
        turns: [{ question: 'Q1', transcript: 'A1' }],
        startTime: 1700000000000,
        pausedAt: null,
      };

      await saveSessionState(state);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@prepmate/session_state',
        JSON.stringify(state)
      );
    });

    it('saves state with pausedAt timestamp', async () => {
      const state: SessionState = {
        sessionId: 'session-456',
        currentQuestion: 'Describe a challenge',
        turns: [],
        startTime: 1700000000000,
        pausedAt: 1700001000000,
      };

      await saveSessionState(state);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@prepmate/session_state',
        JSON.stringify(state)
      );
    });

    it('does not throw on AsyncStorage failure', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      const state: SessionState = {
        sessionId: 'session-789',
        currentQuestion: 'Q?',
        turns: [],
        startTime: Date.now(),
        pausedAt: null,
      };

      await expect(saveSessionState(state)).resolves.not.toThrow();
    });
  });

  describe('loadSessionState', () => {
    it('returns saved session state', async () => {
      const state: SessionState = {
        sessionId: 'session-123',
        currentQuestion: 'Tell me about yourself',
        turns: [{ question: 'Q1', transcript: 'A1' }],
        startTime: 1700000000000,
        pausedAt: 1700001000000,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(state));

      const result = await loadSessionState();
      expect(result).toEqual(state);
    });

    it('returns null when no state is saved', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await loadSessionState();
      expect(result).toBeNull();
    });

    it('returns null for invalid/corrupted data', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('not valid json{{{');

      const result = await loadSessionState();
      expect(result).toBeNull();
    });

    it('returns null when required fields are missing', async () => {
      const incomplete = { sessionId: 'abc' }; // missing currentQuestion and turns
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(incomplete));

      const result = await loadSessionState();
      expect(result).toBeNull();
    });

    it('returns null when turns is not an array', async () => {
      const invalid = {
        sessionId: 'abc',
        currentQuestion: 'Q?',
        turns: 'not an array',
        startTime: Date.now(),
        pausedAt: null,
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(invalid));

      const result = await loadSessionState();
      expect(result).toBeNull();
    });

    it('does not throw on AsyncStorage failure', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));

      const result = await loadSessionState();
      expect(result).toBeNull();
    });
  });

  describe('clearSessionState', () => {
    it('removes session state from AsyncStorage', async () => {
      await clearSessionState();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        '@prepmate/session_state'
      );
    });

    it('does not throw on AsyncStorage failure', async () => {
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Remove error'));

      await expect(clearSessionState()).resolves.not.toThrow();
    });
  });

  describe('queueResponse', () => {
    it('adds a response to the queue', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null); // empty queue

      const response: QueuedResponse = {
        id: 'resp-1',
        sessionId: 'session-123',
        transcript: 'My answer',
        turnNumber: 1,
        speechMetrics: { wpm: 140, fillerCount: 2, anxietyScore: 30 },
        queuedAt: Date.now(),
      };

      await queueResponse(response);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@prepmate/queued_responses',
        JSON.stringify([response])
      );
    });

    it('appends to existing queue', async () => {
      const existing: QueuedResponse = {
        id: 'resp-0',
        sessionId: 'session-123',
        transcript: 'First answer',
        turnNumber: 0,
        speechMetrics: { wpm: 120, fillerCount: 1, anxietyScore: 20 },
        queuedAt: 1700000000000,
      };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([existing]));

      const newResponse: QueuedResponse = {
        id: 'resp-1',
        sessionId: 'session-123',
        transcript: 'Second answer',
        turnNumber: 1,
        speechMetrics: { wpm: 140, fillerCount: 3, anxietyScore: 40 },
        queuedAt: 1700001000000,
      };

      await queueResponse(newResponse);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@prepmate/queued_responses',
        JSON.stringify([existing, newResponse])
      );
    });
  });

  describe('getQueuedResponses', () => {
    it('returns empty array when no responses are queued', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getQueuedResponses();
      expect(result).toEqual([]);
    });

    it('returns queued responses', async () => {
      const responses: QueuedResponse[] = [
        {
          id: 'resp-1',
          sessionId: 'session-123',
          transcript: 'Answer',
          turnNumber: 1,
          speechMetrics: { wpm: 140, fillerCount: 2, anxietyScore: 30 },
          queuedAt: Date.now(),
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(responses));

      const result = await getQueuedResponses();
      expect(result).toEqual(responses);
    });

    it('returns empty array on read failure', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Read error'));

      const result = await getQueuedResponses();
      expect(result).toEqual([]);
    });
  });

  describe('removeQueuedResponse', () => {
    it('removes a specific response by id', async () => {
      const responses: QueuedResponse[] = [
        {
          id: 'resp-1',
          sessionId: 'session-123',
          transcript: 'A1',
          turnNumber: 1,
          speechMetrics: { wpm: 140, fillerCount: 2, anxietyScore: 30 },
          queuedAt: 1700000000000,
        },
        {
          id: 'resp-2',
          sessionId: 'session-123',
          transcript: 'A2',
          turnNumber: 2,
          speechMetrics: { wpm: 150, fillerCount: 1, anxietyScore: 20 },
          queuedAt: 1700001000000,
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(responses));

      await removeQueuedResponse('resp-1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@prepmate/queued_responses',
        JSON.stringify([responses[1]])
      );
    });
  });

  describe('clearQueuedResponses', () => {
    it('removes all queued responses from storage', async () => {
      await clearQueuedResponses();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        '@prepmate/queued_responses'
      );
    });
  });
});
