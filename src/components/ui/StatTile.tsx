/**
 * StatTile — a compact stat card with an icon, value, and label.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing, shadows } from '../../theme/theme';

interface StatTileProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string | number;
  label: string;
  tint?: string;
}

export default function StatTile({ icon, value, label, tint = palette.primary }: StatTileProps) {
  return (
    <Surface style={styles.tile} elevation={0}>
      <View style={[styles.iconWrap, { backgroundColor: tint + '1A' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.ink,
  },
  label: {
    fontSize: 12,
    color: palette.gray,
    marginTop: 2,
  },
});
