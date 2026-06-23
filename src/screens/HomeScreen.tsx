/**
 * HomeScreen — animated, developer-focused dashboard.
 *
 * Streak hero with a weekly activity strip, animated stats, a rotating
 * developer "Daily Challenge", a focus-areas skill breakdown, XP progress,
 * a daily tip, and an achievements preview. Built for SWE-bound students.
 *
 * Requirements: 7.1, 9.1
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, ProgressBar, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '../store/useAppStore';
import { GamificationDoc } from '../types';
import { palette, gradients, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import GradientCard from '../components/ui/GradientCard';
import StatTile from '../components/ui/StatTile';
import FadeInView from '../components/ui/FadeInView';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import WeeklyActivity from '../components/ui/WeeklyActivity';
import SkillBar from '../components/ui/SkillBar';
import { getTipOfTheDay } from '../data/interviewTips';
import { ACHIEVEMENTS, countUnlocked } from '../data/achievements';
import { getChallengeOfTheDay, difficultyColor } from '../data/dailyChallenge';
import { getRoleById } from '../data/roles';

const DEFAULT_GAMIFICATION: GamificationDoc = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: '',
  totalXP: 0,
  level: 1,
  totalSessions: 0,
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const user = useAppStore((s) => s.user);
  const gamification = useAppStore((s) => s.gamification) ?? DEFAULT_GAMIFICATION;
  const { currentStreak, longestStreak, totalXP, level, totalSessions } = gamification;

  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const role = getRoleById(selectedRoleId);

  const displayName = user?.displayName?.trim() || 'Champion';
  const initial = displayName.charAt(0).toUpperCase();

  const xpIntoLevel = totalXP % 100;
  const xpProgress = xpIntoLevel / 100;
  const xpToNext = 100 - xpIntoLevel;

  const tip = getTipOfTheDay();
  const challenge = getChallengeOfTheDay();
  const unlocked = countUnlocked(gamification);
  const previewAchievements = ACHIEVEMENTS.slice(0, 5);

  // Derived "focus area" skill estimates (demo-friendly, deterministic from stats)
  const base = Math.min(90, 45 + totalSessions * 3);
  const skills = [
    { label: 'Clarity', value: Math.min(95, base + 8), color: palette.primary },
    { label: 'Pacing', value: Math.min(92, base + 2), color: palette.blue },
    { label: 'STAR Structure', value: Math.min(90, base - 4), color: palette.green },
    { label: 'Confidence', value: Math.min(88, base), color: palette.coral },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Greeting */}
      <FadeInView delay={0}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={[styles.greetingSmall, { color: c.textMuted }]}>Welcome back,</Text>
            <Text style={[styles.greetingName, { color: c.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.greetingRole} numberOfLines={1}>
              Preparing for {role.title}
            </Text>
          </View>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </LinearGradient>
        </View>
      </FadeInView>

      {/* 2. Streak hero with weekly activity */}
      <FadeInView delay={80}>
        <GradientCard colors={gradients.brand} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <View style={styles.heroStreakRow}>
                <Text style={styles.heroEmoji}>🔥</Text>
                <AnimatedCounter value={currentStreak} style={styles.heroNumber} />
              </View>
              <Text style={styles.heroUnit}>day streak</Text>
            </View>
            <View style={styles.heroBestPill}>
              <MaterialCommunityIcons name="trophy" size={14} color={palette.white} />
              <Text style={styles.heroBestText}>Best {longestStreak}</Text>
            </View>
          </View>
          <View style={[styles.weekStrip, { borderTopColor: c.border }]}>
            <WeeklyActivity currentStreak={currentStreak} />
          </View>
        </GradientCard>
      </FadeInView>

      {/* 3. Stats */}
      <FadeInView delay={160}>
        <View style={styles.statsRow}>
          <StatTile icon="star-four-points" value={`Lv ${level}`} label="Level" tint={palette.primary} />
          <StatTile icon="lightning-bolt" value={totalXP} label="Total XP" tint={palette.amber} />
          <StatTile icon="check-decagram" value={totalSessions} label="Sessions" tint={palette.green} />
        </View>
      </FadeInView>

      {/* Prep navigation cards */}
      <FadeInView delay={200}>
        <Pressable onPress={() => navigation.navigate('Roadmap')}>
          <Surface style={[styles.navCard, { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: role.color }]} elevation={0}>
            <View style={[styles.navIcon, { backgroundColor: role.color + '1A' }]}>
              <MaterialCommunityIcons name="map-marker-path" size={24} color={role.color} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, { color: c.text }]}>Personalized Prep Roadmap</Text>
              <Text style={[styles.navSubtitle, { color: c.textMuted }]}>{role.short} track · tap to customize</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.mist} />
          </Surface>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Analytics')}>
          <Surface style={[styles.navCard, { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: palette.blue }]} elevation={0}>
            <View style={[styles.navIcon, { backgroundColor: palette.blue + '1A' }]}>
              <MaterialCommunityIcons name="chart-box" size={24} color={palette.blue} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, { color: c.text }]}>Detailed Progress & Analytics</Text>
              <Text style={[styles.navSubtitle, { color: c.textMuted }]}>Skill breakdown, trends & insights</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.mist} />
          </Surface>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('QuestionLibrary')}>
          <Surface style={[styles.navCard, { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: palette.green }]} elevation={0}>
            <View style={[styles.navIcon, { backgroundColor: palette.green + '1A' }]}>
              <MaterialCommunityIcons name="bookshelf" size={24} color={palette.green} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, { color: c.text }]}>Question Library</Text>
              <Text style={[styles.navSubtitle, { color: c.textMuted }]}>{role.short} FAQs + aptitude</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.mist} />
          </Surface>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Cheatsheets')}>
          <Surface style={[styles.navCard, { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: palette.amber }]} elevation={0}>
            <View style={[styles.navIcon, { backgroundColor: palette.amber + '1A' }]}>
              <MaterialCommunityIcons name="file-document-multiple" size={24} color={palette.amber} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, { color: c.text }]}>Cheatsheets</Text>
              <Text style={[styles.navSubtitle, { color: c.textMuted }]}>Quick reference for {role.short}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={palette.mist} />
          </Surface>
        </Pressable>
      </FadeInView>

      {/* 4. Daily Challenge */}
      <FadeInView delay={240}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.challengeKicker}>
              <MaterialCommunityIcons name="target" size={16} color={palette.primary} />
              <Text style={styles.kickerText}>Daily Challenge</Text>
            </View>
            <View style={[styles.diffChip, { backgroundColor: difficultyColor(challenge.difficulty) + '22' }]}>
              <Text style={[styles.diffText, { color: difficultyColor(challenge.difficulty) }]}>
                {challenge.difficulty}
              </Text>
            </View>
          </View>
          <View style={styles.challengeBody}>
            <View style={[styles.challengeIcon, { backgroundColor: palette.primary + '14' }]}>
              <MaterialCommunityIcons
                name={(challenge.icon as any) || 'code-tags'}
                size={24}
                color={palette.primary}
              />
            </View>
            <View style={styles.challengeTextWrap}>
              <Text style={[styles.challengeCategory, { color: c.textMuted }]}>{challenge.category}</Text>
              <Text style={[styles.challengePrompt, { color: c.text }]}>{challenge.prompt}</Text>
            </View>
          </View>
          <Button
            mode="contained-tonal"
            icon="play"
            onPress={() => navigation.navigate('Practice')}
            style={styles.challengeButton}
          >
            Practice this
          </Button>
        </Surface>
      </FadeInView>

      {/* 5. Focus areas */}
      <FadeInView delay={320}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Your Focus Areas</Text>
            <MaterialCommunityIcons name="chart-donut" size={20} color={palette.mist} />
          </View>
          <Text style={[styles.caption, { color: c.textMuted }]}>Based on your recent sessions</Text>
          <View style={{ marginTop: spacing.lg }}>
            {skills.map((s, i) => (
              <SkillBar key={s.label} label={s.label} value={s.value} color={s.color} delay={400 + i * 120} />
            ))}
          </View>
        </Surface>
      </FadeInView>

      {/* 6. XP progress */}
      <FadeInView delay={400}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Level {level}</Text>
            <Text style={styles.xpValue}>{xpIntoLevel} / 100 XP</Text>
          </View>
          <ProgressBar progress={xpProgress} color={palette.primary} style={styles.progressBar} />
          <Text style={[styles.caption, { color: c.textMuted }]}>{xpToNext} XP to level {level + 1}</Text>
        </Surface>
      </FadeInView>

      {/* 7. Daily tip */}
      <FadeInView delay={480}>
        <Surface style={[styles.card, styles.tipCard, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.tipIconWrap}>
            <MaterialCommunityIcons
              name={(tip.icon as any) || 'lightbulb-on'}
              size={22}
              color={palette.primary}
            />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipKicker}>Tip of the day</Text>
            <Text style={[styles.tipTitle, { color: c.text }]}>{tip.title}</Text>
            <Text style={[styles.tipText, { color: c.textMuted }]}>{tip.body}</Text>
          </View>
        </Surface>
      </FadeInView>

      {/* 8. Achievements preview */}
      <FadeInView delay={560}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Achievements</Text>
            <Pressable onPress={() => navigation.navigate('Achievements')} hitSlop={8}>
              <Text style={styles.seeAll}>See all ›</Text>
            </Pressable>
          </View>
          <Text style={[styles.caption, { color: c.textMuted }]}>{unlocked} of {ACHIEVEMENTS.length} unlocked</Text>
          <View style={styles.badgeRow}>
            {previewAchievements.map((a) => {
              const isUnlocked = a.isUnlocked(gamification);
              return (
                <View
                  key={a.id}
                  style={[styles.badge, { backgroundColor: isUnlocked ? a.color + '1A' : palette.fog }]}
                >
                  <MaterialCommunityIcons
                    name={(a.icon as any) || 'medal'}
                    size={24}
                    color={isUnlocked ? a.color : palette.mist}
                  />
                </View>
              );
            })}
          </View>
        </Surface>
      </FadeInView>

      {/* 9. CTA */}
      <FadeInView delay={640}>
        <Button
          mode="contained"
          icon="microphone"
          onPress={() => navigation.navigate('Practice')}
          style={styles.cta}
          contentStyle={styles.ctaContent}
          labelStyle={styles.ctaLabel}
          buttonColor={palette.primary}
        >
          Start Practice
        </Button>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.snow },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  greetingText: { flex: 1, marginRight: spacing.md },
  greetingSmall: { fontSize: 14, color: palette.gray },
  greetingName: { fontSize: 28, fontWeight: '800', color: palette.ink, marginTop: 2 },
  greetingRole: { fontSize: 13, color: palette.primary, fontWeight: '600', marginTop: 2 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: palette.white },

  // Hero
  hero: { marginBottom: spacing.xl },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroStreakRow: { flexDirection: 'row', alignItems: 'center' },
  heroEmoji: { fontSize: 40, marginRight: spacing.sm },
  heroNumber: { fontSize: 52, fontWeight: '800', color: palette.white, lineHeight: 56 },
  heroUnit: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  heroBestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  heroBestText: { fontSize: 13, fontWeight: '700', color: palette.white, marginLeft: spacing.xs },
  weekStrip: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  navTextWrap: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  navSubtitle: { fontSize: 12, color: palette.gray, marginTop: 2 },

  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.ink },
  xpValue: { fontSize: 13, fontWeight: '600', color: palette.primary },
  progressBar: { height: 10, borderRadius: radius.pill, backgroundColor: palette.fog, marginTop: spacing.md },
  caption: { fontSize: 12, color: palette.gray, marginTop: spacing.sm },

  // Daily challenge
  challengeKicker: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  kickerText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  diffText: { fontSize: 11, fontWeight: '800' },
  challengeBody: { flexDirection: 'row', marginTop: spacing.lg },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  challengeTextWrap: { flex: 1 },
  challengeCategory: { fontSize: 12, fontWeight: '700', color: palette.gray, marginBottom: 2 },
  challengePrompt: { fontSize: 14, lineHeight: 20, color: palette.ink, fontWeight: '600' },
  challengeButton: { marginTop: spacing.lg, borderRadius: radius.md, alignSelf: 'flex-start' },

  // Tip
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: palette.primary + '0D' },
  tipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tipBody: { flex: 1 },
  tipKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tipTitle: { fontSize: 15, fontWeight: '700', color: palette.ink, marginBottom: spacing.xs },
  tipText: { fontSize: 13, lineHeight: 19, color: palette.slate },

  // Achievements
  seeAll: { fontSize: 13, fontWeight: '600', color: palette.primary },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA
  cta: { borderRadius: radius.lg, ...shadows.glow },
  ctaContent: { height: 58 },
  ctaLabel: { fontSize: 17, fontWeight: '700' },
});
