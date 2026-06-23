import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, Surface } from 'react-native-paper';

export interface FillerAlertProps {
  /** Whether the alert should be visible */
  visible: boolean;
  /** Current filler word count per minute */
  fillerCount: number;
}

/**
 * Visual alert displayed when filler word usage exceeds 5 per minute.
 * Renders as a red banner/chip with the current filler rate.
 *
 * Requirements: 3.3
 */
export default function FillerAlert({ visible, fillerCount }: FillerAlertProps) {
  if (!visible) return null;

  return (
    <Surface style={styles.surface} elevation={1}>
      <Chip
        icon="alert-circle"
        style={styles.chip}
        textStyle={styles.chipText}
        compact
      >
        Too many fillers! ({fillerCount}/min)
      </Chip>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    marginVertical: 4,
  },
  chip: {
    backgroundColor: '#F44336',
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
