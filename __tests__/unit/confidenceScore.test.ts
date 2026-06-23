import { calculateConfidenceScore, getConfidenceCategory } from '../../src/services/confidenceScore';
import { ConfidenceCategory } from '../../src/types';

describe('calculateConfidenceScore', () => {
  it('calculates correctly with zero anxiety and full STAR score', () => {
    // (100 - 0) * 0.6 + 100 * 0.4 = 60 + 40 = 100
    expect(calculateConfidenceScore(0, 100)).toBe(100);
  });

  it('calculates correctly with full anxiety and zero STAR score', () => {
    // (100 - 100) * 0.6 + 0 * 0.4 = 0 + 0 = 0
    expect(calculateConfidenceScore(100, 0)).toBe(0);
  });

  it('calculates correctly with moderate values', () => {
    // (100 - 50) * 0.6 + 70 * 0.4 = 30 + 28 = 58
    expect(calculateConfidenceScore(50, 70)).toBe(58);
  });

  it('rounds to nearest integer', () => {
    // (100 - 33) * 0.6 + 55 * 0.4 = 67 * 0.6 + 22 = 40.2 + 22 = 62.2 → 62
    expect(calculateConfidenceScore(33, 55)).toBe(62);
  });

  it('handles rounding up correctly', () => {
    // (100 - 25) * 0.6 + 77 * 0.4 = 75 * 0.6 + 30.8 = 45 + 30.8 = 75.8 → 76
    expect(calculateConfidenceScore(25, 77)).toBe(76);
  });

  it('handles both inputs at zero', () => {
    // (100 - 0) * 0.6 + 0 * 0.4 = 60 + 0 = 60
    expect(calculateConfidenceScore(0, 0)).toBe(60);
  });

  it('handles both inputs at 100', () => {
    // (100 - 100) * 0.6 + 100 * 0.4 = 0 + 40 = 40
    expect(calculateConfidenceScore(100, 100)).toBe(40);
  });
});

describe('getConfidenceCategory', () => {
  it('returns NeedsWork for scores 0-39', () => {
    expect(getConfidenceCategory(0)).toBe(ConfidenceCategory.NeedsWork);
    expect(getConfidenceCategory(20)).toBe(ConfidenceCategory.NeedsWork);
    expect(getConfidenceCategory(39)).toBe(ConfidenceCategory.NeedsWork);
  });

  it('returns Developing for scores 40-59', () => {
    expect(getConfidenceCategory(40)).toBe(ConfidenceCategory.Developing);
    expect(getConfidenceCategory(50)).toBe(ConfidenceCategory.Developing);
    expect(getConfidenceCategory(59)).toBe(ConfidenceCategory.Developing);
  });

  it('returns Competent for scores 60-79', () => {
    expect(getConfidenceCategory(60)).toBe(ConfidenceCategory.Competent);
    expect(getConfidenceCategory(70)).toBe(ConfidenceCategory.Competent);
    expect(getConfidenceCategory(79)).toBe(ConfidenceCategory.Competent);
  });

  it('returns Confident for scores 80-100', () => {
    expect(getConfidenceCategory(80)).toBe(ConfidenceCategory.Confident);
    expect(getConfidenceCategory(90)).toBe(ConfidenceCategory.Confident);
    expect(getConfidenceCategory(100)).toBe(ConfidenceCategory.Confident);
  });

  it('handles exact boundary values correctly', () => {
    expect(getConfidenceCategory(39)).toBe(ConfidenceCategory.NeedsWork);
    expect(getConfidenceCategory(40)).toBe(ConfidenceCategory.Developing);
    expect(getConfidenceCategory(59)).toBe(ConfidenceCategory.Developing);
    expect(getConfidenceCategory(60)).toBe(ConfidenceCategory.Competent);
    expect(getConfidenceCategory(79)).toBe(ConfidenceCategory.Competent);
    expect(getConfidenceCategory(80)).toBe(ConfidenceCategory.Confident);
  });
});
