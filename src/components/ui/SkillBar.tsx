/**
 * SkillBar — labeled, animated horizontal progress bar for a skill/metric.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { palette, radius, spacing } from '../../theme/theme';

interface SkillBarProps {
  label: string;
  value: number; // 0-100
  color?: string;
  delay?: number;
}

export default function SkillBar({ label, value, color = palette.primary, delay = 0 }: SkillBarProps) {
  const width = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [clamped, delay, width]);

  const widthInterpolated = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>{clamped}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.slate,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.fog,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
