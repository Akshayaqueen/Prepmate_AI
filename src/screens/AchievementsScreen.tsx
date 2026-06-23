/**
 * AchievementsScreen — displays unlockable badges and progress.
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { ACHIEVEMENTS, countUnlocked } from '../data/achievements';
import { GamificationDoc } from '../types';
import { palette, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import GradientCard from '../components/ui/GradientCard';
import { gradients } from '../theme/theme';

const DEFAULT_G: GamificationDoc = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  totalXP: 0,
  level: 1,
  totalSessions: 0,
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const c = useColors();
  const gamification = useAppStore((s) => s.gamification) ?? DEFAULT_G;
  const unlocked = countUnlocked(gamification);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} iconColor={c.text} onPress={() => navigation.goBack()} />
          <Text style={[styles.headerTitle, { color: c.text }]}>Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        <GradientCard colors={gradients.candy} style={styles.summary}>
          <MaterialCommunityIcons name="trophy-award" size={40} color={palette.white} />
          <Text style={styles.summaryValue}>
            {unlocked} / {ACHIEVEMENTS.length}
          </Text>
          <Text style={styles.summaryLabel}>Badges Unlocked</Text>
        </GradientCard>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = a.isUnlocked(gamification);
            const progress = a.progress ? a.progress(gamification) : isUnlocked ? 1 : 0;
            return (
              <Surface
                key={a.id}
                style={[styles.badge, { backgroundColor: c.surface }, !isUnlocked && styles.badgeLocked]}
                elevation={0}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    { backgroundColor: isUnlocked ? a.color + '22' : c.surfaceAlt },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(a.icon as any) || 'medal'}
                    size={28}
                    color={isUnlocked ? a.color : palette.mist}
                  />
                </View>
                <Text style={[styles.badgeTitle, { color: c.text }, !isUnlocked && styles.lockedText]}>{a.title}</Text>
                <Text style={[styles.badgeDesc, { color: c.textMuted }]}>{a.description}</Text>
                {!isUnlocked && (
                  <ProgressBar
                    progress={progress}
                    color={a.color}
                    style={[styles.badgeProgress, { backgroundColor: c.surfaceAlt }]}
                  />
                )}
                {isUnlocked && (
                  <View style={styles.unlockedRow}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={palette.green} />
                    <Text style={styles.unlockedText}>Unlocked</Text>
                  </View>
                )}
              </Surface>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.snow },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: palette.ink },
  summary: { alignItems: 'center', marginBottom: spacing.xl },
  summaryValue: { fontSize: 32, fontWeight: '800', color: palette.white, marginTop: spacing.sm },
  summaryLabel: { color: palette.white, opacity: 0.9 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badge: {
    width: '48%',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  badgeLocked: { opacity: 0.7 },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  lockedText: { color: palette.gray },
  badgeDesc: { fontSize: 12, color: palette.gray, marginTop: 2, minHeight: 32 },
  badgeProgress: { marginTop: spacing.sm, height: 6, borderRadius: 3, backgroundColor: palette.fog },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
  unlockedText: { fontSize: 12, color: palette.green, fontWeight: '600' },
});
