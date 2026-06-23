/**
 * Unit tests for gamificationService.ts
 * Tests Firestore integration logic for loading, saving, and orchestrating gamification.
 * Requirements: 7.1, 7.2, 7.3
 */

import { Difficulty, GamificationDoc } from '../../src/types';

// Mock firebase/firestore
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('../../src/config/firebase', () => ({
  db: 'mock-db',
}));

import { loadGamification, saveGamification, onSessionComplete } from '../../src/services/gamificationService';

function makeDoc(overrides: Partial<GamificationDoc> = {}): GamificationDoc {
  return {
    currentStreak: 3,
    longestStreak: 7,
    lastPracticeDate: '2024-06-14',
    totalXP: 150,
    level: 2,
    totalSessions: 10,
    ...overrides,
  };
}

describe('loadGamification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  it('returns gamification data when document exists', async () => {
    const data = makeDoc();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => data });

    const result = await loadGamification('user123');

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user123', 'gamification', 'stats');
    expect(result).toEqual(data);
  });

  it('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });

    const result = await loadGamification('user456');

    expect(result).toBeNull();
  });
});

describe('saveGamification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
  });

  it('writes gamification data to Firestore', async () => {
    const data = makeDoc();
    await saveGamification('user123', data);

    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user123', 'gamification', 'stats');
    expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', data);
  });
});

describe('onSessionComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
    mockSetDoc.mockResolvedValue(undefined);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates default doc for new user (no existing data)', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });

    const result = await onSessionComplete('newUser', Difficulty.Beginner);

    expect(result.gamification.currentStreak).toBe(1);
    expect(result.gamification.totalXP).toBe(10);
    expect(result.gamification.level).toBe(1);
    expect(result.gamification.totalSessions).toBe(1);
    expect(result.gamification.lastPracticeDate).toBe('2024-06-15');
    expect(result.milestone).toBeNull();
  });

  it('increments streak for consecutive day practice', async () => {
    const existing = makeDoc({ currentStreak: 3, longestStreak: 7, lastPracticeDate: '2024-06-14' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Intermediate);

    expect(result.gamification.currentStreak).toBe(4);
    expect(result.gamification.longestStreak).toBe(7);
    expect(result.gamification.totalXP).toBe(170);
    expect(result.gamification.level).toBe(2);
    expect(result.gamification.totalSessions).toBe(11);
    expect(result.milestone).toBeNull();
  });

  it('resets streak if day was missed', async () => {
    const existing = makeDoc({ currentStreak: 5, longestStreak: 10, lastPracticeDate: '2024-06-10' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Advanced);

    expect(result.gamification.currentStreak).toBe(1);
    expect(result.gamification.longestStreak).toBe(10);
    expect(result.gamification.totalXP).toBe(180);
    expect(result.gamification.level).toBe(2);
    expect(result.gamification.totalSessions).toBe(11);
    expect(result.milestone).toBeNull();
  });

  it('awards correct XP for each difficulty level', async () => {
    const existing = makeDoc({ totalXP: 0, lastPracticeDate: '2024-06-14' });

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ ...existing }) });
    const resultBeginner = await onSessionComplete('user1', Difficulty.Beginner);
    expect(resultBeginner.gamification.totalXP).toBe(10);

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ ...existing }) });
    const resultIntermediate = await onSessionComplete('user2', Difficulty.Intermediate);
    expect(resultIntermediate.gamification.totalXP).toBe(20);

    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ ...existing }) });
    const resultAdvanced = await onSessionComplete('user3', Difficulty.Advanced);
    expect(resultAdvanced.gamification.totalXP).toBe(30);
  });

  it('recalculates level when XP crosses threshold', async () => {
    const existing = makeDoc({ totalXP: 95, lastPracticeDate: '2024-06-14' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Beginner);

    expect(result.gamification.totalXP).toBe(105);
    expect(result.gamification.level).toBe(2);
  });

  it('saves the updated doc to Firestore', async () => {
    const existing = makeDoc({ lastPracticeDate: '2024-06-14' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Beginner);

    expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', result.gamification);
  });

  it('does not change streak on same-day duplicate session', async () => {
    const existing = makeDoc({ currentStreak: 3, lastPracticeDate: '2024-06-15', totalSessions: 5 });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Beginner);

    expect(result.gamification.currentStreak).toBe(3);
    expect(result.gamification.totalSessions).toBe(6);
    expect(result.gamification.totalXP).toBe(160);
  });

  it('detects week milestone at streak 7', async () => {
    const existing = makeDoc({ currentStreak: 6, longestStreak: 6, lastPracticeDate: '2024-06-14' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Beginner);

    expect(result.gamification.currentStreak).toBe(7);
    expect(result.milestone).toBe('week');
  });

  it('detects month milestone at streak 30', async () => {
    const existing = makeDoc({ currentStreak: 29, longestStreak: 29, lastPracticeDate: '2024-06-14' });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => existing });

    const result = await onSessionComplete('user123', Difficulty.Beginner);

    expect(result.gamification.currentStreak).toBe(30);
    expect(result.milestone).toBe('month');
  });
});
