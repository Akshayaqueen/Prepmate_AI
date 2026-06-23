import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfidenceCategory } from '../types';
import { getConfidenceCategory } from '../services/confidenceScore';
import type { MainStackParamList, SessionResultsParams } from '../navigation/AppNavigator';
import {
  palette,
  gradients,
  spacing,
  radius,
  shadows,
  categoryColors,
} from '../theme/theme';
import GradientCard from '../components/ui/GradientCard';
import StatTile from '../components/ui/StatTile';
import ProgressRing from '../components/ui/ProgressRing';
import FadeInView from '../components/ui/FadeInView';

// ─── Mock data matching the endSession response format ───────────────────────
const MOCK_RESULTS: SessionResultsParams = {
  confidenceScore: 72,
  confidenceCategory: ConfidenceCategory.Competent,
  avgStarScore: 68,
  anxietyReading: 35,
  fillerCount: 12,
  sessionDuration: 420, // 7 minutes
  topSuggestions: [
    'Add more quantified results to strengthen your Action and Result sections.',
    'Slow your pace slightly during technical explanations to improve clarity.',
  ],
  xpAwarded: 20,
};

// ─── Category labels ─────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<ConfidenceCategory, string> = {
  [ConfidenceCategory.NeedsWork]: 'Needs Work',
  [ConfidenceCategory.Developing]: 'Developing',
  [ConfidenceCategory.Competent]: 'Competent',
  [ConfidenceCategory.Confident]: 'Confident',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
type ResultsRouteProp = RouteProp<MainStackParamList, 'Results'>;

export default function ResultsScreen() {
  const route = useRoute<ResultsRouteProp>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Use route params if available, fall back to mock data
  const results: SessionResultsParams = route.params?.results ?? MOCK_RESULTS;

  const category = results.confidenceCategory ?? getConfidenceCategory(results.confidenceScore);
  const categoryColor = categoryColors[category];
  const categoryLabel = CATEGORY_LABELS[category];

  const handleViewRewrite = () => {
    // AnswerRewriter screen is not yet wired into the stack — no-op for now.
  };

  const handleBackToHome = () => {
    navigation.popToTop();
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <FadeInView delay={0}>
      <GradientCard colors={gradients.brand} style={styles.hero}>
        <Text style={styles.heroTitle}>Session Complete 🎉</Text>

        <View style={styles.ringWrap}>
          <ProgressRing
            value={results.confidenceScore}
            size={168}
            strokeWidth={14}
            color={palette.white}
            trackColor="rgba(255,255,255,0.25)"
            caption=""
          />
          <View style={styles.ringCaption} pointerEvents="none">
            <Text style={styles.ringCaptionText}>Confidence</Text>
          </View>
        </View>

        <Text style={styles.categoryLabel}>{categoryLabel}</Text>

        <View style={styles.xpChip}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={palette.white} />
          <Text style={styles.xpChipText}>+{results.xpAwarded} XP awarded</Text>
        </View>
      </GradientCard>
      </FadeInView>

      {/* ── Metrics ── */}
      <FadeInView delay={120}>
      <Text style={styles.sectionTitle}>Your Metrics</Text>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <StatTile icon="star" value={results.avgStarScore} label="STAR Score" tint={palette.amber} />
          <View style={styles.gridGap} />
          <StatTile icon="heart-pulse" value={results.anxietyReading} label="Anxiety" tint={palette.coral} />
        </View>
        <View style={styles.gridRowSpacer} />
        <View style={styles.gridRow}>
          <StatTile icon="message-alert" value={results.fillerCount} label="Fillers" tint={palette.blue} />
          <View style={styles.gridGap} />
          <StatTile
            icon="clock-outline"
            value={formatDuration(results.sessionDuration)}
            label="Duration"
            tint={palette.green}
          />
        </View>
      </View>
      </FadeInView>

      {/* ── Top Improvements ── */}
      {results.topSuggestions.length > 0 && (
        <FadeInView delay={240}>
        <Surface style={styles.suggestionsCard} elevation={0}>
          <View style={styles.suggestionsHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color={palette.primary} />
            <Text style={styles.suggestionsTitle}>Top Improvements</Text>
          </View>
          {results.topSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </Surface>
        </FadeInView>
      )}

      {/* ── Actions ── */}
      <FadeInView delay={360}>
      <Button
        mode="contained"
        icon="auto-fix"
        style={styles.primaryButton}
        contentStyle={styles.buttonContent}
        labelStyle={styles.primaryLabel}
        onPress={handleViewRewrite}
      >
        View Rewritten Answer
      </Button>

      <Button
        mode="outlined"
        style={styles.outlinedButton}
        contentStyle={styles.buttonContent}
        labelStyle={styles.outlinedLabel}
        onPress={handleBackToHome}
      >
        Back to Home
      </Button>
      </FadeInView>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.snow,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.white,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ringCaption: {
    position: 'absolute',
    bottom: 38,
    alignItems: 'center',
  },
  ringCaptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  categoryLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.white,
    marginTop: spacing.xs,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  xpChipText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: spacing.xs + 2,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
    marginBottom: spacing.md,
  },

  // Metrics grid
  grid: {
    marginBottom: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridGap: {
    width: spacing.md,
  },
  gridRowSpacer: {
    height: spacing.md,
  },

  // Suggestions
  suggestionsCard: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.ink,
    marginLeft: spacing.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 1,
  },
  badgeText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 13,
  },
  suggestionText: {
    flex: 1,
    color: palette.slate,
    fontSize: 14,
    lineHeight: 21,
  },

  // Buttons
  primaryButton: {
    borderRadius: radius.lg,
    backgroundColor: palette.primary,
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  primaryLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: palette.white,
  },
  outlinedButton: {
    borderRadius: radius.lg,
    borderColor: palette.cloud,
    borderWidth: 1.5,
  },
  outlinedLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: palette.slate,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
