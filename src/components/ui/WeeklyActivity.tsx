/**
 * WeeklyActivity — a 7-day streak strip (last 7 days), highlighting
 * days the user practiced. Today is outlined.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing } from '../../theme/theme';

interface WeeklyActivityProps {
  /** Number of consecutive active days ending today (current streak). */
  currentStreak: number;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function WeeklyActivity({ currentStreak }: WeeklyActivityProps) {
  const today = new Date();
  const todayIdx = today.getDay();

  // Build last 7 days (oldest → today). A day is "active" if it falls within
  // the current streak window.
  const days = Array.from({ length: 7 }).map((_, i) => {
    const offset = 6 - i; // 6 days ago ... today
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const active = offset < currentStreak; // most recent `currentStreak` days
    const isToday = offset === 0;
    return {
      letter: DAY_LETTERS[date.getDay()],
      active,
      isToday,
    };
  });

  return (
    <View style={styles.row}>
      {days.map((d, i) => (
        <View key={i} style={styles.dayCol}>
          <View
            style={[
              styles.dot,
              d.active && styles.dotActive,
              d.isToday && styles.dotToday,
            ]}
          >
            {d.active ? (
              <MaterialCommunityIcons name="fire" size={16} color={palette.white} />
            ) : (
              <View style={styles.dotEmpty} />
            )}
          </View>
          <Text style={[styles.dayLetter, d.isToday && styles.dayLetterToday]}>{d.letter}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: palette.fog,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: palette.coral,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: palette.primary,
  },
  dotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.cloud,
  },
  dayLetter: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '600',
    color: palette.mist,
  },
  dayLetterToday: {
    color: palette.primary,
    fontWeight: '800',
  },
});
