import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

export interface AnxietyMeterProps {
  /** Anxiety score from 0 (calm) to 100 (very nervous) */
  score: number;
}

/** Map score ranges to colors: green (0-30), yellow (31-60), red (61-100) */
function getColor(score: number): string {
  if (score <= 30) return '#4CAF50'; // green
  if (score <= 60) return '#FFC107'; // yellow/amber
  return '#F44336'; // red
}

/** Map score ranges to human-readable labels */
function getLabel(score: number): string {
  if (score <= 30) return 'Calm';
  if (score <= 60) return 'Moderate';
  return 'Nervous';
}

const RADIUS = 45;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;

/**
 * Circular gauge displaying real-time anxiety level (0-100).
 *
 * Color coding:
 *   Green  (0-30)  — Calm
 *   Yellow (31-60) — Moderate
 *   Red    (61-100) — Nervous
 *
 * Requirements: 3.5
 */
export default function AnxietyMeter({ score }: AnxietyMeterProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const progress = clampedScore / 100;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const color = getColor(clampedScore);

  return (
    <Surface style={styles.surface} elevation={2}>
      <Text variant="labelMedium" style={styles.title}>
        Anxiety Meter
      </Text>
      <View style={styles.gaugeContainer}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#E0E0E0"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.scoreOverlay}>
          <Text variant="headlineMedium" style={[styles.scoreText, { color }]}>
            {clampedScore}
          </Text>
          <Text variant="labelSmall" style={styles.labelText}>
            {getLabel(clampedScore)}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginBottom: 8,
    color: '#6B7280',
  },
  gaugeContainer: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '700',
  },
  labelText: {
    color: '#6B7280',
  },
});
