/**
 * GradientCard — a rounded card with a linear-gradient background.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, shadows } from '../../theme/theme';

interface GradientCardProps {
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export default function GradientCard({
  colors,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientCardProps) {
  return (
    <View style={[styles.shadow, style]}>
      <LinearGradient colors={colors} start={start} end={end} style={styles.gradient}>
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.lg,
    ...shadows.md,
  },
  gradient: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: 20,
  },
});
