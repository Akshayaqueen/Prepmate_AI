import { updateStreak, getYesterday, awardXP, calculateLevel, checkMilestone } from '../../src/services/gamification';
import { Difficulty, GamificationDoc } from '../../src/types';

function makeDoc(overrides: Partial<GamificationDoc> = {}): GamificationDoc {
  return {
    currentStreak: 1,
    longestStreak: 1,
    lastPracticeDate: '2024-06-10',
    totalXP: 0,
    level: 1,
    totalSessions: 0,
    ...overrides,
  };
}

describe('getYesterday', () => {
  it('returns previous day for a normal date', () => {
    expect(getYesterday('2024-06-15')).toBe('2024-06-14');
  });

  it('crosses month boundary', () => {
    expect(getYesterday('2024-07-01')).toBe('2024-06-30');
  });

  it('crosses year boundary', () => {
    expect(getYesterday('2024-01-01')).toBe('2023-12-31');
  });

  it('handles leap year (March 1 of leap year)', () => {
    expect(getYesterday('2024-03-01')).toBe('2024-02-29');
  });

  it('handles non-leap year (March 1)', () => {
    expect(getYesterday('2023-03-01')).toBe('2023-02-28');
  });
});

describe('updateStreak', () => {
  describe('same day — no change', () => {
    it('returns the same document when today equals lastPracticeDate', () => {
      const doc = makeDoc({ currentStreak: 5, longestStreak: 10, lastPracticeDate: '2024-06-15' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result).toEqual(doc);
    });

    it('returns the exact same reference (identity check)', () => {
      const doc = makeDoc({ lastPracticeDate: '2024-06-15' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result).toBe(doc);
    });
  });

  describe('consecutive day — increment streak', () => {
    it('increments currentStreak by 1', () => {
      const doc = makeDoc({ currentStreak: 3, longestStreak: 5, lastPracticeDate: '2024-06-14' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.currentStreak).toBe(4);
    });

    it('updates lastPracticeDate to today', () => {
      const doc = makeDoc({ currentStreak: 3, longestStreak: 5, lastPracticeDate: '2024-06-14' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.lastPracticeDate).toBe('2024-06-15');
    });

    it('does not update longestStreak if current is still below it', () => {
      const doc = makeDoc({ currentStreak: 3, longestStreak: 10, lastPracticeDate: '2024-06-14' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.longestStreak).toBe(10);
    });

    it('updates longestStreak when current exceeds it', () => {
      const doc = makeDoc({ currentStreak: 10, longestStreak: 10, lastPracticeDate: '2024-06-14' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.currentStreak).toBe(11);
      expect(result.longestStreak).toBe(11);
    });

    it('handles month boundary (June 30 → July 1)', () => {
      const doc = makeDoc({ currentStreak: 2, longestStreak: 5, lastPracticeDate: '2024-06-30' });
      const result = updateStreak(doc, '2024-07-01');
      expect(result.currentStreak).toBe(3);
    });

    it('handles year boundary (Dec 31 → Jan 1)', () => {
      const doc = makeDoc({ currentStreak: 7, longestStreak: 7, lastPracticeDate: '2023-12-31' });
      const result = updateStreak(doc, '2024-01-01');
      expect(result.currentStreak).toBe(8);
      expect(result.longestStreak).toBe(8);
    });
  });

  describe('missed day — reset streak', () => {
    it('resets currentStreak to 1 when more than one day missed', () => {
      const doc = makeDoc({ currentStreak: 5, longestStreak: 10, lastPracticeDate: '2024-06-10' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.currentStreak).toBe(1);
    });

    it('updates lastPracticeDate to today', () => {
      const doc = makeDoc({ currentStreak: 5, longestStreak: 10, lastPracticeDate: '2024-06-10' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.lastPracticeDate).toBe('2024-06-15');
    });

    it('preserves longestStreak (never decreases)', () => {
      const doc = makeDoc({ currentStreak: 5, longestStreak: 20, lastPracticeDate: '2024-06-10' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.longestStreak).toBe(20);
    });

    it('resets on exactly 2 days gap', () => {
      const doc = makeDoc({ currentStreak: 3, longestStreak: 3, lastPracticeDate: '2024-06-13' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.currentStreak).toBe(1);
    });

    it('preserves other fields (totalXP, level, totalSessions)', () => {
      const doc = makeDoc({
        currentStreak: 5,
        longestStreak: 10,
        lastPracticeDate: '2024-06-10',
        totalXP: 500,
        level: 6,
        totalSessions: 25,
      });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.totalXP).toBe(500);
      expect(result.level).toBe(6);
      expect(result.totalSessions).toBe(25);
    });
  });

  describe('longestStreak invariant', () => {
    it('longestStreak never decreases after a reset', () => {
      const doc = makeDoc({ currentStreak: 15, longestStreak: 15, lastPracticeDate: '2024-06-01' });
      const afterReset = updateStreak(doc, '2024-06-15');
      expect(afterReset.longestStreak).toBe(15);
      expect(afterReset.currentStreak).toBe(1);
    });

    it('longestStreak grows when consecutive streak surpasses it', () => {
      const doc = makeDoc({ currentStreak: 5, longestStreak: 5, lastPracticeDate: '2024-06-14' });
      const result = updateStreak(doc, '2024-06-15');
      expect(result.longestStreak).toBe(6);
    });
  });
});


describe('awardXP', () => {
  it('returns 10 XP for beginner difficulty', () => {
    expect(awardXP(Difficulty.Beginner)).toBe(10);
  });

  it('returns 20 XP for intermediate difficulty', () => {
    expect(awardXP(Difficulty.Intermediate)).toBe(20);
  });

  it('returns 30 XP for advanced difficulty', () => {
    expect(awardXP(Difficulty.Advanced)).toBe(30);
  });
});

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 for 99 XP', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns level 2 for exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('returns level 2 for 199 XP', () => {
    expect(calculateLevel(199)).toBe(2);
  });

  it('returns level 3 for 200 XP', () => {
    expect(calculateLevel(200)).toBe(3);
  });

  it('returns level 11 for 1000 XP', () => {
    expect(calculateLevel(1000)).toBe(11);
  });

  it('returns correct level for large XP values', () => {
    expect(calculateLevel(9999)).toBe(100);
  });
});

describe('checkMilestone', () => {
  it('returns "week" when streak is exactly 7', () => {
    expect(checkMilestone(7)).toBe('week');
  });

  it('returns "month" when streak is exactly 30', () => {
    expect(checkMilestone(30)).toBe('month');
  });

  it('returns null for streak of 1', () => {
    expect(checkMilestone(1)).toBeNull();
  });

  it('returns null for streak of 0', () => {
    expect(checkMilestone(0)).toBeNull();
  });

  it('returns null for streak of 6 (just below week milestone)', () => {
    expect(checkMilestone(6)).toBeNull();
  });

  it('returns null for streak of 8 (just above week milestone)', () => {
    expect(checkMilestone(8)).toBeNull();
  });

  it('returns null for streak of 29 (just below month milestone)', () => {
    expect(checkMilestone(29)).toBeNull();
  });

  it('returns null for streak of 31 (just above month milestone)', () => {
    expect(checkMilestone(31)).toBeNull();
  });

  it('returns null for large streak values (e.g. 100)', () => {
    expect(checkMilestone(100)).toBeNull();
  });
});
