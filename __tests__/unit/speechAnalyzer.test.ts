/**
 * Unit tests for Speech Analyzer module
 * Requirements: 3.1, 3.2, 3.6
 */

import { analyzeTurn, calculateAnxiety, shouldShowFillerAlert, shouldShowPacingAlert, aggregateSessionMetrics, SessionSpeechSummary, FILLER_WORDS } from '../../src/services/speechAnalyzer';
import { SpeechMetrics } from '../../src/types';
describe('analyzeTurn', () => {
  it('returns correct word count and WPM for a simple transcript', () => {
    // 10 words in 60 seconds = 10 WPM
    const transcript = 'one two three four five six seven eight nine ten';
    const result = analyzeTurn(transcript, 60);

    expect(result.wpm).toBe(10);
    expect(result.durationSeconds).toBe(60);
  });

  it('detects filler words case-insensitively', () => {
    const transcript = 'Um I think uh that basically we should actually do it';
    const result = analyzeTurn(transcript, 30);

    expect(result.fillerCount).toBe(4); // um, uh, basically, actually
    expect(result.fillerWords).toContain('um');
    expect(result.fillerWords).toContain('uh');
    expect(result.fillerWords).toContain('basically');
    expect(result.fillerWords).toContain('actually');
  });

  it('detects "you know" as a multi-word filler phrase', () => {
    const transcript = 'I think you know that we should you know try harder';
    const result = analyzeTurn(transcript, 30);

    expect(result.fillerCount).toBe(2);
    expect(result.fillerWords).toEqual(['you know', 'you know']);
  });

  it('does not count "like" within words like "likely"', () => {
    const transcript = 'This is likely going to work and I like it';
    const result = analyzeTurn(transcript, 30);

    // Only standalone "like" should match, not "likely"
    expect(result.fillerCount).toBe(1);
    expect(result.fillerWords).toEqual(['like']);
  });

  it('does not count "um" within words like "umbrella"', () => {
    const transcript = 'I brought my umbrella today';
    const result = analyzeTurn(transcript, 30);

    expect(result.fillerCount).toBe(0);
    expect(result.fillerWords).toEqual([]);
  });

  it('handles empty transcript', () => {
    const result = analyzeTurn('', 60);

    expect(result.wpm).toBe(0);
    expect(result.fillerCount).toBe(0);
    expect(result.fillerWords).toEqual([]);
    expect(result.durationSeconds).toBe(60);
  });

  it('handles zero duration gracefully', () => {
    const result = analyzeTurn('hello world', 0);

    expect(result.wpm).toBe(0);
    expect(result.anxietyScore).toBe(0);
    expect(result.durationSeconds).toBe(0);
  });

  it('calculates anxiety score within [0, 100]', () => {
    // High filler rate + fast pace -> high anxiety
    const transcript = 'um uh like basically actually um uh like basically actually';
    const result = analyzeTurn(transcript, 10); // 10 words in 10 seconds = 60 WPM (below ideal)

    expect(result.anxietyScore).toBeGreaterThanOrEqual(0);
    expect(result.anxietyScore).toBeLessThanOrEqual(100);
  });

  it('produces low anxiety for ideal speech (no fillers, ideal pace)', () => {
    // Generate 140 words (ideal WPM at 60 seconds)
    const words = Array(140).fill('word').join(' ');
    const result = analyzeTurn(words, 60);

    // No fillers + ideal pace = 0 anxiety
    expect(result.anxietyScore).toBe(0);
  });

  it('produces high anxiety for many fillers and deviant pace', () => {
    // 20 fillers in 30 seconds = 40/min filler rate (way above 10/min threshold)
    const fillers = Array(20).fill('um').join(' ');
    const result = analyzeTurn(fillers, 30); // 20 words in 30s = 40 WPM (very slow)

    expect(result.anxietyScore).toBeGreaterThan(50);
  });

  it('exports FILLER_WORDS constant', () => {
    expect(FILLER_WORDS).toContain('um');
    expect(FILLER_WORDS).toContain('uh');
    expect(FILLER_WORDS).toContain('like');
    expect(FILLER_WORDS).toContain('you know');
    expect(FILLER_WORDS).toContain('basically');
    expect(FILLER_WORDS).toContain('actually');
    expect(FILLER_WORDS).toHaveLength(6);
  });

  it('correctly computes WPM formula: wordCount / (durationSeconds / 60)', () => {
    const transcript = 'a b c d e f g h i j'; // 10 words
    const durationSeconds = 30; // 0.5 minutes
    const result = analyzeTurn(transcript, durationSeconds);

    expect(result.wpm).toBe(10 / (30 / 60)); // 20 WPM
  });
});

describe('calculateAnxiety', () => {
  it('returns 0 for ideal speech (no fillers, 140 WPM)', () => {
    // 140 words in 1 minute = 140 WPM (ideal), 0 fillers
    const result = calculateAnxiety(0, 140, 1);
    expect(result).toBe(0);
  });

  it('returns 100 for maximum anxiety (high fillers + far from ideal pace)', () => {
    // 10+ fillers/min -> fillerNormalized = 1.0
    // WPM far from 140 (e.g. 20 words in 1 min = 20 WPM, deviation = 120/40 = 3.0, clamped to 1.0)
    const result = calculateAnxiety(10, 20, 1);
    expect(result).toBe(100);
  });

  it('output is always clamped to [0, 100]', () => {
    // Even with extreme inputs, result stays in range
    const result = calculateAnxiety(100, 5, 0.1);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns 0 for durationMinutes <= 0', () => {
    expect(calculateAnxiety(5, 100, 0)).toBe(0);
    expect(calculateAnxiety(5, 100, -1)).toBe(0);
  });

  it('correctly applies the formula', () => {
    // 5 fillers in 2 minutes = 2.5 fillers/min -> fillerNormalized = 2.5/10 = 0.25
    // 280 words in 2 minutes = 140 WPM -> paceNormalized = |140-140|/40 = 0
    // anxiety = round((0.25 * 0.6 + 0 * 0.4) * 100) = round(15) = 15
    const result = calculateAnxiety(5, 280, 2);
    expect(result).toBe(15);
  });

  it('handles only pace deviation (no fillers)', () => {
    // 0 fillers -> fillerNormalized = 0
    // 100 words in 1 minute = 100 WPM -> deviation = |100-140|/40 = 1.0
    // anxiety = round((0 * 0.6 + 1.0 * 0.4) * 100) = round(40) = 40
    const result = calculateAnxiety(0, 100, 1);
    expect(result).toBe(40);
  });

  it('handles only filler component (ideal pace)', () => {
    // 5 fillers in 1 minute = 5/min -> fillerNormalized = 5/10 = 0.5
    // 140 words in 1 minute = 140 WPM (ideal) -> paceNormalized = 0
    // anxiety = round((0.5 * 0.6 + 0 * 0.4) * 100) = round(30) = 30
    const result = calculateAnxiety(5, 140, 1);
    expect(result).toBe(30);
  });
});


describe('shouldShowFillerAlert', () => {
  it('returns true when filler rate exceeds 5 per minute', () => {
    // 6 fillers in 1 minute = 6/min > 5
    expect(shouldShowFillerAlert(6, 1)).toBe(true);
  });

  it('returns false when filler rate is exactly 5 per minute', () => {
    // 5 fillers in 1 minute = 5/min, not > 5
    expect(shouldShowFillerAlert(5, 1)).toBe(false);
  });

  it('returns false when filler rate is below 5 per minute', () => {
    // 3 fillers in 1 minute = 3/min < 5
    expect(shouldShowFillerAlert(3, 1)).toBe(false);
  });

  it('returns false when durationMinutes is zero or negative', () => {
    expect(shouldShowFillerAlert(10, 0)).toBe(false);
    expect(shouldShowFillerAlert(10, -1)).toBe(false);
  });

  it('correctly handles fractional durations', () => {
    // 3 fillers in 0.5 minutes = 6/min > 5
    expect(shouldShowFillerAlert(3, 0.5)).toBe(true);
    // 2 fillers in 0.5 minutes = 4/min < 5
    expect(shouldShowFillerAlert(2, 0.5)).toBe(false);
  });
});

describe('shouldShowPacingAlert', () => {
  it('returns true when wpm is below 100', () => {
    expect(shouldShowPacingAlert(99)).toBe(true);
    expect(shouldShowPacingAlert(50)).toBe(true);
  });

  it('returns true when wpm is above 180', () => {
    expect(shouldShowPacingAlert(181)).toBe(true);
    expect(shouldShowPacingAlert(200)).toBe(true);
  });

  it('returns false when wpm is exactly 100', () => {
    expect(shouldShowPacingAlert(100)).toBe(false);
  });

  it('returns false when wpm is exactly 180', () => {
    expect(shouldShowPacingAlert(180)).toBe(false);
  });

  it('returns false when wpm is within range (100-180)', () => {
    expect(shouldShowPacingAlert(140)).toBe(false);
    expect(shouldShowPacingAlert(120)).toBe(false);
    expect(shouldShowPacingAlert(160)).toBe(false);
  });
});

describe('aggregateSessionMetrics', () => {
  it('returns zeroes for an empty array', () => {
    const result = aggregateSessionMetrics([]);

    expect(result.totalFillerCount).toBe(0);
    expect(result.avgWpm).toBe(0);
    expect(result.finalAnxiety).toBe(0);
  });

  it('correctly sums filler counts across turns', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 140, fillerCount: 3, fillerWords: ['um', 'uh', 'like'], anxietyScore: 20, durationSeconds: 60 },
      { wpm: 140, fillerCount: 5, fillerWords: ['um', 'uh', 'like', 'basically', 'actually'], anxietyScore: 30, durationSeconds: 60 },
      { wpm: 140, fillerCount: 2, fillerWords: ['um', 'uh'], anxietyScore: 15, durationSeconds: 60 },
    ];

    const result = aggregateSessionMetrics(turns);

    expect(result.totalFillerCount).toBe(10); // 3 + 5 + 2
  });

  it('correctly calculates average WPM', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 120, fillerCount: 0, fillerWords: [], anxietyScore: 0, durationSeconds: 60 },
      { wpm: 140, fillerCount: 0, fillerWords: [], anxietyScore: 0, durationSeconds: 60 },
      { wpm: 160, fillerCount: 0, fillerWords: [], anxietyScore: 0, durationSeconds: 60 },
    ];

    const result = aggregateSessionMetrics(turns);

    expect(result.avgWpm).toBe(140); // (120 + 140 + 160) / 3
  });

  it('correctly handles a single turn', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 150, fillerCount: 4, fillerWords: ['um', 'uh', 'like', 'basically'], anxietyScore: 25, durationSeconds: 90 },
    ];

    const result = aggregateSessionMetrics(turns);

    expect(result.totalFillerCount).toBe(4);
    expect(result.avgWpm).toBe(150);
    // finalAnxiety is calculated from aggregate using calculateAnxiety
    // Total words = 150 * (90/60) = 225
    // Total duration in minutes = 90/60 = 1.5
    // fillerRate = 4 / 1.5 = 2.67, fillerNormalized = min(2.67/10, 1) = 0.267
    // wpm = 225 / 1.5 = 150, paceNorm = min(|150-140|/40, 1) = 0.25
    // anxiety = round((0.267*0.6 + 0.25*0.4) * 100) = round((0.16 + 0.1)*100) = round(26) = 26
    const expectedAnxiety = calculateAnxiety(4, 225, 1.5);
    expect(result.finalAnxiety).toBe(expectedAnxiety);
  });

  it('calculates finalAnxiety from aggregate metrics using calculateAnxiety', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 140, fillerCount: 0, fillerWords: [], anxietyScore: 0, durationSeconds: 60 },
      { wpm: 140, fillerCount: 0, fillerWords: [], anxietyScore: 0, durationSeconds: 60 },
    ];

    const result = aggregateSessionMetrics(turns);

    // 0 fillers, 140 WPM (ideal) across both turns → 0 anxiety
    expect(result.finalAnxiety).toBe(0);
  });

  it('produces high anxiety when aggregate metrics are poor', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 40, fillerCount: 10, fillerWords: Array(10).fill('um'), anxietyScore: 90, durationSeconds: 60 },
      { wpm: 40, fillerCount: 10, fillerWords: Array(10).fill('uh'), anxietyScore: 90, durationSeconds: 60 },
    ];

    const result = aggregateSessionMetrics(turns);

    expect(result.totalFillerCount).toBe(20);
    expect(result.avgWpm).toBe(40);
    // High filler rate + very slow pace → high anxiety
    expect(result.finalAnxiety).toBeGreaterThan(50);
  });

  it('returns a SessionSpeechSummary with correct shape', () => {
    const turns: SpeechMetrics[] = [
      { wpm: 130, fillerCount: 2, fillerWords: ['um', 'uh'], anxietyScore: 20, durationSeconds: 45 },
    ];

    const result: SessionSpeechSummary = aggregateSessionMetrics(turns);

    expect(result).toHaveProperty('totalFillerCount');
    expect(result).toHaveProperty('avgWpm');
    expect(result).toHaveProperty('finalAnxiety');
    expect(typeof result.totalFillerCount).toBe('number');
    expect(typeof result.avgWpm).toBe('number');
    expect(typeof result.finalAnxiety).toBe('number');
  });
});
