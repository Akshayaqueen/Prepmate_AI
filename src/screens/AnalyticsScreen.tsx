/**
 * AnalyticsScreen — Detailed progress & analytics.
 *
 * Shows level/XP, role-based solved categories (DSA, System Design, …),
 * a confidence trend, a skill breakdown, and mock performance history.
 * Theme-aware (light/dark).
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '../store/useAppStore';
import { getRoleById } from '../data/roles';
import { palette, gradients, spacing, radius, shadows, categoryColors } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import GradientCard from '../components/ui/GradientCard';
import SkillBar from '../components/ui/SkillBar';
import FadeInView from '../components/ui/FadeInView';
import TrendChart from '../components/TrendChart';
import { getConfidenceCategory } from '../services/confidenceScore';

const DEMO_TREND = [
  { date: new Date(Date.now() - 6 * 864e5).toISOString(), confidenceScore: 54, anxietyReading: 58 },
  { date: new Date(Date.now() - 4 * 864e5).toISOString(), confidenceScore: 63, anxietyReading: 47 },
  { date: new Date(Date.now() - 2 * 864e5).toISOString(), confidenceScore: 71, anxietyReading: 38 },
  { date: new Date().toISOString(), confidenceScore: 78, anxietyReading: 31 },
];

interface MockRecord {
  date: string;
  label: string;
  round: string;
  score: number;
}

const CATEGORY_ICONS = ['code-braces', 'sitemap', 'flask', 'account-group', 'chart-box', 'cloud'];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  const gamification = useAppStore((s) => s.gamification);
  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const role = getRoleById(selectedRoleId);

  const totalSessions = gamification?.totalSessions ?? 0;
  const totalXP = gamification?.totalXP ?? 0;
  const level = gamification?.level ?? 1;
  const xpIntoLevel = totalXP % 100;

  // Role-aware skill scores
  const skills = useMemo(() => {
    const boost = Math.min(25, totalSessions * 2);
    return role.focusAreas.map((f, i) => ({
      label: f.label,
      value: Math.max(20, Math.min(98, Math.round(f.weight * 0.6 + boost - i * 3))),
      color: [palette.primary, palette.blue, palette.green, palette.coral][i % 4],
    }));
  }, [role, totalSessions]);

  // Role-based "solved categories" (e.g. DSA, System Design …) with counts
  const categories = useMemo(() => {
    return role.focusAreas.map((f, i) => {
      const target = 20;
      const solved = Math.min(target, Math.round((f.weight / 100) * (6 + totalSessions)));
      return {
        label: f.label,
        icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
        color: [palette.primary, palette.blue, palette.green, palette.coral][i % 4],
        solved,
        target,
      };
    });
  }, [role, totalSessions]);

  const totalSolved = categories.reduce((s, c2) => s + c2.solved, 0);

  // Mock performance history (demo)
  const mocks: MockRecord[] = useMemo(
    () => [
      { date: 'Today', label: `${role.short} · Technical`, round: '5/5 rounds', score: 78 },
      { date: '2 days ago', label: `${role.short} · Behavioral`, round: '4/5 rounds', score: 71 },
      { date: '5 days ago', label: `${role.short} · Technical`, round: '5/5 rounds', score: 63 },
      { date: '1 week ago', label: `${role.short} · Mixed`, round: '3/5 rounds', score: 54 },
    ],
    [role]
  );

  const avgConfidence = 78;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView delay={0}>
        <Text style={[styles.title, { color: c.text }]}>Progress & Analytics</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>{role.title} track</Text>
      </FadeInView>

      {/* Level card */}
      <FadeInView delay={80}>
        <GradientCard colors={gradients.brand} style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.levelSub}>{totalXP} XP earned · {totalSolved} questions solved</Text>
            </View>
          </View>
          <ProgressBar
            progress={xpIntoLevel / 100}
            color={palette.white}
            style={styles.levelProgress}
          />
          <Text style={styles.levelHint}>{100 - xpIntoLevel} XP to level {level + 1}</Text>
        </GradientCard>
      </FadeInView>

      {/* Solved categories */}
      <FadeInView delay={160}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Solved Categories</Text>
          <Text style={[styles.caption, { color: c.textMuted }]}>For {role.short} preparation</Text>
          <View style={{ marginTop: spacing.md }}>
            {categories.map((cat) => (
              <View key={cat.label} style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + '1A' }]}>
                  <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <View style={styles.catBody}>
                  <View style={styles.catHeader}>
                    <Text style={[styles.catLabel, { color: c.text }]}>{cat.label}</Text>
                    <Text style={[styles.catCount, { color: c.textMuted }]}>
                      {cat.solved}/{cat.target}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={cat.solved / cat.target}
                    color={cat.color}
                    style={[styles.catProgress, { backgroundColor: c.surfaceAlt }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </Surface>
      </FadeInView>

      {/* Trend chart */}
      <FadeInView delay={240}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Confidence vs Anxiety</Text>
          <TrendChart sessions={DEMO_TREND} />
        </Surface>
      </FadeInView>

      {/* Skill breakdown */}
      <FadeInView delay={320}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Skill Breakdown</Text>
          <Text style={[styles.caption, { color: c.textMuted }]}>Tailored to {role.short}</Text>
          <View style={{ marginTop: spacing.lg }}>
            {skills.map((s, i) => (
              <SkillBar key={s.label} label={s.label} value={s.value} color={s.color} delay={360 + i * 100} />
            ))}
          </View>
        </Surface>
      </FadeInView>

      {/* Mock performance history */}
      <FadeInView delay={400}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Mock Performance History</Text>
          <View style={{ marginTop: spacing.md }}>
            {mocks.map((m, i) => {
              const cat = getConfidenceCategory(m.score);
              const color = categoryColors[cat];
              return (
                <View key={i} style={[styles.mockRow, { borderBottomColor: c.border }]}>
                  <View style={[styles.mockScore, { backgroundColor: color + '1A' }]}>
                    <Text style={[styles.mockScoreText, { color }]}>{m.score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mockLabel, { color: c.text }]}>{m.label}</Text>
                    <Text style={[styles.mockMeta, { color: c.textMuted }]}>
                      {m.date} · {m.round}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
                </View>
              );
            })}
          </View>
        </Surface>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },

  // Level
  levelCard: { marginBottom: spacing.xl },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelBadge: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: { fontSize: 24, fontWeight: '800', color: palette.white },
  levelTitle: { fontSize: 18, fontWeight: '800', color: palette.white },
  levelSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  levelProgress: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: spacing.lg },
  levelHint: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm },

  card: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  caption: { fontSize: 12, marginTop: spacing.xs },

  // Categories
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  catBody: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  catLabel: { fontSize: 14, fontWeight: '700' },
  catCount: { fontSize: 13, fontWeight: '700' },
  catProgress: { height: 7, borderRadius: radius.pill },

  // Mock history
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  mockScore: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockScoreText: { fontSize: 16, fontWeight: '800' },
  mockLabel: { fontSize: 14, fontWeight: '700' },
  mockMeta: { fontSize: 12, marginTop: 2 },
});
