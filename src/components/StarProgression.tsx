import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { StarBreakdown } from '../types';

export interface StarProgressionProps {
  /** Array of STAR scores from attempts on the same/similar question */
  attempts: { date: string; score: number; starBreakdown: StarBreakdown }[];
}

/** Returns a color indicating improvement relative to the previous attempt */
function getBarColor(currentScore: number, previousScore: number | null): string {
  if (previousScore === null) return '#6B7280'; // neutral for first attempt
  return currentScore > previousScore ? '#4CAF50' : '#6B7280'; // green if improved
}

/** Format a date string for display (short) */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const MAX_BAR_HEIGHT = 120;

/**
 * Displays STAR score progression across multiple attempts at the same question.
 *
 * - Shows a "practice more" message when fewer than 2 attempts
 * - Shows a simple bar chart with color coding when 2+ attempts exist
 *   - Green bars indicate improvement from previous attempt
 *   - Gray/neutral bars for no improvement or first attempt
 *
 * Requirements: 4.5
 */
export default function StarProgression({ attempts }: StarProgressionProps) {
  if (attempts.length < 2) {
    return (
      <Surface style={styles.surface} elevation={2}>
        <Text variant="titleMedium" style={styles.title}>
          Score History
        </Text>
        <Text variant="bodyMedium" style={styles.emptyMessage}>
          Practice this question more to see progress!
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.surface} elevation={2}>
      <Text variant="titleMedium" style={styles.title}>
        Your Progress
      </Text>
      <View style={styles.chartContainer}>
        {attempts.map((attempt, index) => {
          const previousScore = index > 0 ? attempts[index - 1].score : null;
          const barColor = getBarColor(attempt.score, previousScore);
          const barHeight = Math.max(4, (attempt.score / 100) * MAX_BAR_HEIGHT);

          return (
            <View key={`${attempt.date}-${index}`} style={styles.barColumn}>
              <Text variant="labelSmall" style={styles.scoreLabel}>
                {attempt.score}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: barColor },
                ]}
              />
              <Text variant="labelSmall" style={styles.attemptLabel}>
                #{index + 1}
              </Text>
              <Text variant="labelSmall" style={styles.dateLabel}>
                {formatDate(attempt.date)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Mini breakdown for latest attempt */}
      <View style={styles.breakdownContainer}>
        <Text variant="labelMedium" style={styles.breakdownTitle}>
          Latest Breakdown
        </Text>
        <View style={styles.breakdownRow}>
          <BreakdownChip label="S" value={attempts[attempts.length - 1].starBreakdown.situation} />
          <BreakdownChip label="T" value={attempts[attempts.length - 1].starBreakdown.task} />
          <BreakdownChip label="A" value={attempts[attempts.length - 1].starBreakdown.action} />
          <BreakdownChip label="R" value={attempts[attempts.length - 1].starBreakdown.result} />
        </View>
      </View>
    </Surface>
  );
}

function BreakdownChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text variant="labelSmall" style={styles.chipLabel}>
        {label}
      </Text>
      <Text variant="bodySmall" style={styles.chipValue}>
        {value}/25
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyMessage: {
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 8,
    minHeight: MAX_BAR_HEIGHT + 40,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 60,
  },
  scoreLabel: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#374151',
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  attemptLabel: {
    marginTop: 4,
    color: '#6B7280',
  },
  dateLabel: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  breakdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  breakdownTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipLabel: {
    fontWeight: '700',
    color: '#374151',
  },
  chipValue: {
    color: '#6B7280',
  },
});
