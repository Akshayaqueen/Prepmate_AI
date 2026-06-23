import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

import { db, auth } from '../config/firebase';
import { Session, Persona, ConfidenceCategory } from '../types';
import { getConfidenceCategory } from '../services/confidenceScore';
import { palette, gradients, spacing, radius, shadows, categoryColors } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import TrendChart from '../components/TrendChart';
import type { SessionResultsParams } from '../navigation/AppNavigator';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A session record where createdAt may be a Firestore Timestamp or a plain Date. */
interface SessionWithId extends Omit<Session, 'createdAt'> {
  id: string;
  createdAt: { toDate?: () => Date } | Date | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERSONA_DISPLAY: Record<
  Persona,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }
> = {
  [Persona.Friendly]: { label: 'Friendly Coach', icon: 'emoticon-happy-outline', color: palette.green },
  [Persona.Tough]: { label: 'Tough Challenger', icon: 'sword-cross', color: palette.coral },
  [Persona.Technical]: { label: 'Technical Griller', icon: 'code-tags', color: palette.blue },
};

const DEFAULT_PERSONA = {
  label: 'Interview',
  icon: 'microphone' as keyof typeof MaterialCommunityIcons.glyphMap,
  color: palette.primary,
};

/**
 * Demo-mode fallback. When there's no Firestore data (empty result or error),
 * we show these sample sessions so the Progress screen looks alive.
 */
const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(14, 30, 0, 0);
  return d;
};

const SAMPLE_SESSIONS: SessionWithId[] = [
  {
    id: 'sample-1',
    createdAt: daysAgo(1),
    persona: Persona.Technical,
    confidenceScore: 82,
    avgStarScore: 88,
    anxietyReading: 24,
    fillerCount: 4,
    avgWpm: 142,
    duration: 612,
    industry: undefined as any,
    difficulty: undefined as any,
    topSuggestions: [
      'Great structure — keep quantifying your impact.',
      'Trim a few filler words during transitions.',
    ],
  },
  {
    id: 'sample-2',
    createdAt: daysAgo(3),
    persona: Persona.Friendly,
    confidenceScore: 74,
    avgStarScore: 79,
    anxietyReading: 33,
    fillerCount: 7,
    avgWpm: 128,
    duration: 540,
    industry: undefined as any,
    difficulty: undefined as any,
    topSuggestions: [
      'Strong rapport — add more concrete metrics.',
      'Slow down slightly on the Action section.',
    ],
  },
  {
    id: 'sample-3',
    createdAt: daysAgo(6),
    persona: Persona.Tough,
    confidenceScore: 65,
    avgStarScore: 70,
    anxietyReading: 47,
    fillerCount: 11,
    avgWpm: 119,
    duration: 498,
    industry: undefined as any,
    difficulty: undefined as any,
    topSuggestions: [
      'Stay composed under pushback — pause before answering.',
      'Lead with the Result to hook the interviewer.',
    ],
  },
  {
    id: 'sample-4',
    createdAt: daysAgo(9),
    persona: Persona.Friendly,
    confidenceScore: 58,
    avgStarScore: 62,
    anxietyReading: 55,
    fillerCount: 14,
    avgWpm: 108,
    duration: 432,
    industry: undefined as any,
    difficulty: undefined as any,
    topSuggestions: [
      'Build a clear Situation → Task → Action → Result arc.',
      'Reduce "um" and "like" by pausing instead.',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(timestamp: { toDate?: () => Date } | Date | null): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (typeof (timestamp as any).toDate === 'function') return (timestamp as any).toDate();
  return null;
}

function formatDate(timestamp: { toDate?: () => Date } | Date | null): string {
  const date = toDate(timestamp);
  if (!date) return 'Unknown date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const [sessions, setSessions] = useState<SessionWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      // Demo mode: no authenticated user → show samples.
      setSessions(SAMPLE_SESSIONS);
      setLoading(false);
      return;
    }

    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const q = query(sessionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const fetchedSessions: SessionWithId[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SessionWithId[];

      // Demo fallback: if there's no real data, show samples so the screen looks alive.
      setSessions(fetchedSessions.length > 0 ? fetchedSessions : SAMPLE_SESSIONS);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions(SAMPLE_SESSIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Map sessions → TrendChart shape (oldest → newest for a left-to-right timeline).
  const trendData = useMemo(() => {
    return sessions
      .map((s) => {
        const date = toDate(s.createdAt) ?? new Date();
        return {
          date: date.toISOString(),
          confidenceScore: s.confidenceScore,
          anxietyReading: s.anxietyReading,
        };
      })
      .reverse();
  }, [sessions]);

  const handleSessionPress = (session: SessionWithId) => {
    const results: SessionResultsParams = {
      confidenceScore: session.confidenceScore,
      confidenceCategory:
        session.confidenceScore != null
          ? getConfidenceCategory(session.confidenceScore)
          : ConfidenceCategory.NeedsWork,
      avgStarScore: session.avgStarScore,
      anxietyReading: session.anxietyReading,
      fillerCount: session.fillerCount,
      sessionDuration: session.duration,
      topSuggestions: session.topSuggestions ?? [],
      xpAwarded: 0, // XP was already awarded at session end
    };

    navigation.navigate('Results', { results });
  };

  const renderSessionItem = ({ item }: { item: SessionWithId }) => {
    const persona = PERSONA_DISPLAY[item.persona] ?? DEFAULT_PERSONA;
    const category = getConfidenceCategory(item.confidenceScore);
    const categoryColor = categoryColors[category];

    return (
      <TouchableOpacity
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Session on ${formatDate(item.createdAt)}, ${persona.label}, confidence score ${item.confidenceScore}`}
      >
        <Surface style={[styles.sessionCard, { backgroundColor: c.surface }]} elevation={0}>
          {/* Persona icon badge */}
          <View style={[styles.personaBadge, { backgroundColor: persona.color + '1A' }]}>
            <MaterialCommunityIcons name={persona.icon} size={24} color={persona.color} />
          </View>

          {/* Date + persona name */}
          <View style={styles.cardCenter}>
            <Text variant="titleSmall" style={[styles.personaName, { color: c.text }]} numberOfLines={1}>
              {persona.label}
            </Text>
            <Text variant="bodySmall" style={[styles.dateText, { color: c.textMuted }]} numberOfLines={1}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Stacked mini-stats */}
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatValue, { color: categoryColor }]}>
                {item.confidenceScore}
              </Text>
              <Text style={[styles.miniStatLabel, { color: c.textMuted }]}>Confidence</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatValue, { color: c.text }]}>{item.avgStarScore}</Text>
              <Text style={[styles.miniStatLabel, { color: c.textMuted }]}>STAR</Text>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={palette.mist}
            style={styles.chevron}
          />
        </Surface>
      </TouchableOpacity>
    );
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centeredContainer, { paddingTop: insets.top, backgroundColor: c.bg }]}>
        <ActivityIndicator animating size="large" color={palette.primary} />
        <Text variant="bodyMedium" style={[styles.loadingText, { color: c.textMuted }]}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  const ListHeader = (
    <View>
      <Text variant="headlineMedium" style={[styles.title, { color: c.text }]}>
        Your Progress
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: c.textMuted }]}>
        Track your improvement over time
      </Text>

      <View style={[styles.chartCard, { backgroundColor: c.surface }]}>
        <TrendChart sessions={trendData} />
      </View>

      <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>
        Recent Sessions
      </Text>
    </View>
  );

  // ─── Empty State ─────────────────────────────────────────────────────────────
  // Only reachable if both real and sample sessions are empty (shouldn't happen
  // with the demo fallback) — kept as a graceful safety net.
  if (sessions.length === 0) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: c.bg }]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {ListHeader}
        <Surface style={[styles.emptyCard, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="chart-line-variant" size={40} color={palette.primary} />
          </View>
          <Text variant="titleMedium" style={[styles.emptyTitle, { color: c.text }]}>
            No sessions yet
          </Text>
          <Text variant="bodyMedium" style={[styles.emptyText, { color: c.textMuted }]}>
            Start practicing to see your history and progress trends here.
          </Text>
        </Surface>
      </ScrollView>
    );
  }

  // ─── Session List ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: c.bg }]}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.snow,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.snow,
    padding: spacing.xl,
  },
  loadingText: {
    color: palette.gray,
    marginTop: spacing.md,
  },
  title: {
    fontWeight: '700',
    color: palette.ink,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: palette.gray,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    color: palette.ink,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // Session Card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    ...shadows.sm,
  },
  personaBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCenter: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  personaName: {
    fontWeight: '700',
    color: palette.ink,
  },
  dateText: {
    color: palette.gray,
    marginTop: 2,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStat: {
    alignItems: 'center',
    minWidth: 56,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
  },
  miniStatLabel: {
    fontSize: 11,
    color: palette.mist,
    marginTop: 2,
  },
  chevron: {
    marginLeft: spacing.xs,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    ...shadows.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: palette.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    color: palette.ink,
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: palette.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
