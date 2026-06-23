import { calculateTotalStarScore, getLengthAdvisory } from '../../src/services/starScore';
import { StarBreakdown } from '../../src/types';

describe('calculateTotalStarScore', () => {
  it('sums all four STAR components', () => {
    const breakdown: StarBreakdown = { situation: 20, task: 15, action: 25, result: 10 };
    expect(calculateTotalStarScore(breakdown)).toBe(70);
  });

  it('returns 0 when all components are 0', () => {
    const breakdown: StarBreakdown = { situation: 0, task: 0, action: 0, result: 0 };
    expect(calculateTotalStarScore(breakdown)).toBe(0);
  });

  it('returns 100 when all components are 25', () => {
    const breakdown: StarBreakdown = { situation: 25, task: 25, action: 25, result: 25 };
    expect(calculateTotalStarScore(breakdown)).toBe(100);
  });
});

describe('getLengthAdvisory', () => {
  it('returns "too_short" for duration under 30 seconds', () => {
    expect(getLengthAdvisory(10)).toBe('too_short');
    expect(getLengthAdvisory(29)).toBe('too_short');
    expect(getLengthAdvisory(0)).toBe('too_short');
  });

  it('returns "too_long" for duration over 180 seconds', () => {
    expect(getLengthAdvisory(181)).toBe('too_long');
    expect(getLengthAdvisory(300)).toBe('too_long');
  });

  it('returns null for duration within acceptable range', () => {
    expect(getLengthAdvisory(30)).toBeNull();
    expect(getLengthAdvisory(90)).toBeNull();
    expect(getLengthAdvisory(180)).toBeNull();
  });
});
