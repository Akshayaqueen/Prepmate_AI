import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, Surface } from 'react-native-paper';

export interface PacingAlertProps {
  /** Whether the alert should be visible */
  visible: boolean;
  /** Current words per minute */
  wpm: number;
  /** Whether the user is speaking too slowly or too fast */
  type: 'too_slow' | 'too_fast';
}

/**
 * Visual alert displayed when speaking pace falls outside the ideal range
 * (below 100 WPM or above 180 WPM).
 * Renders as an orange banner/chip with the current WPM and direction.
 *
 * Requirements: 3.4
 */
export default function PacingAlert({ visible, wpm, type }: PacingAlertProps) {
  if (!visible) return null;

  const label =
    type === 'too_fast'
      ? `Speaking too fast! (${Math.round(wpm)} WPM)`
      : `Speaking too slow! (${Math.round(wpm)} WPM)`;

  const icon = type === 'too_fast' ? 'speedometer' : 'speedometer-slow';

  return (
    <Surface style={styles.surface} elevation={1}>
      <Chip
        icon={icon}
        style={styles.chip}
        textStyle={styles.chipText}
        compact
      >
        {label}
      </Chip>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    marginVertical: 4,
  },
  chip: {
    backgroundColor: '#FF9800',
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
