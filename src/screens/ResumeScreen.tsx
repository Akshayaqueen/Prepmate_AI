/**
 * ResumeScreen — offline Resume Analyzer.
 *
 * Paste resume text (or load a sample) and get an instant heuristic
 * score across 5 dimensions with strengths and improvement tips.
 * Fully theme-aware (light/dark).
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, gradients, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import GradientCard from '../components/ui/GradientCard';
import ProgressRing from '../components/ui/ProgressRing';
import FadeInView from '../components/ui/FadeInView';
import { analyzeResume, ResumeAnalysis, SAMPLE_RESUME } from '../services/resumeAnalyzer';

const STATUS_COLOR = {
  good: palette.green,
  warn: palette.amber,
  bad: palette.coral,
};

const STATUS_ICON = {
  good: 'check-circle',
  warn: 'alert-circle',
  bad: 'close-circle',
} as const;

export default function ResumeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();

  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleAnalyze = () => {
    if (text.trim().length === 0) return;
    setAnalysis(analyzeResume(text));
  };

  const handleSample = () => {
    setText(SAMPLE_RESUME);
    setAnalysis(analyzeResume(SAMPLE_RESUME));
  };

  const handleReset = () => {
    setText('');
    setAnalysis(null);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView delay={0}>
          <Text style={[styles.title, { color: c.text }]}>Resume Analyzer</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Paste your resume for instant feedback
          </Text>
        </FadeInView>

        {/* Input */}
        <FadeInView delay={80}>
          <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
            <TextInput
              style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.bg }]}
              multiline
              numberOfLines={8}
              placeholder="Paste your resume text here…"
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={setText}
            />
            <View style={styles.inputActions}>
              <Button
                mode="text"
                icon="file-document-outline"
                onPress={handleSample}
                textColor={c.primary}
                compact
              >
                Try sample
              </Button>
              {text.length > 0 && (
                <Button mode="text" icon="refresh" onPress={handleReset} textColor={c.textMuted} compact>
                  Clear
                </Button>
              )}
            </View>
            <Button
              mode="contained"
              icon="text-search"
              onPress={handleAnalyze}
              disabled={text.trim().length === 0}
              style={styles.analyzeButton}
              contentStyle={styles.analyzeContent}
              buttonColor={palette.primary}
            >
              Analyze Resume
            </Button>
          </Surface>
        </FadeInView>

        {/* Results */}
        {analysis && (
          <>
            <FadeInView delay={0}>
              <GradientCard colors={gradients.brand} style={styles.scoreCard}>
                <ProgressRing
                  value={analysis.overallScore}
                  size={150}
                  strokeWidth={13}
                  color={palette.white}
                  trackColor="rgba(255,255,255,0.25)"
                  caption=""
                />
                <Text style={styles.scoreLabel}>Resume Score</Text>
                <Text style={styles.scoreSub}>{analysis.wordCount} words analyzed</Text>
              </GradientCard>
            </FadeInView>

            {/* Dimension checks */}
            <FadeInView delay={120}>
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Breakdown</Text>
                {analysis.checks.map((check) => (
                  <View key={check.id} style={[styles.checkRow, { borderBottomColor: c.border }]}>
                    <MaterialCommunityIcons
                      name={STATUS_ICON[check.status]}
                      size={22}
                      color={STATUS_COLOR[check.status]}
                    />
                    <View style={styles.checkBody}>
                      <View style={styles.checkHeader}>
                        <Text style={[styles.checkLabel, { color: c.text }]}>{check.label}</Text>
                        <Text style={[styles.checkScore, { color: STATUS_COLOR[check.status] }]}>
                          {check.score}
                        </Text>
                      </View>
                      <Text style={[styles.checkDetail, { color: c.textMuted }]}>{check.detail}</Text>
                    </View>
                  </View>
                ))}
              </Surface>
            </FadeInView>

            {/* Strengths */}
            <FadeInView delay={200}>
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
                <View style={styles.listHeader}>
                  <MaterialCommunityIcons name="thumb-up" size={20} color={palette.green} />
                  <Text style={[styles.sectionTitle, { color: c.text, marginLeft: spacing.sm }]}>
                    Strengths
                  </Text>
                </View>
                {analysis.strengths.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <MaterialCommunityIcons name="check" size={16} color={palette.green} />
                    <Text style={[styles.bulletText, { color: c.text }]}>{s}</Text>
                  </View>
                ))}
              </Surface>
            </FadeInView>

            {/* Improvements */}
            <FadeInView delay={280}>
              <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
                <View style={styles.listHeader}>
                  <MaterialCommunityIcons name="lightbulb-on" size={20} color={palette.amber} />
                  <Text style={[styles.sectionTitle, { color: c.text, marginLeft: spacing.sm }]}>
                    Improvements
                  </Text>
                </View>
                {analysis.improvements.map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <MaterialCommunityIcons name="arrow-up-bold-circle" size={16} color={palette.amber} />
                    <Text style={[styles.bulletText, { color: c.text }]}>{s}</Text>
                  </View>
                ))}
              </Surface>
            </FadeInView>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },

  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 160,
    fontSize: 14,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  analyzeButton: { borderRadius: radius.md, marginTop: spacing.sm },
  analyzeContent: { paddingVertical: spacing.sm },

  scoreCard: { alignItems: 'center', marginBottom: spacing.xl },
  scoreLabel: { fontSize: 18, fontWeight: '800', color: palette.white, marginTop: spacing.md },
  scoreSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  checkBody: { flex: 1 },
  checkHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  checkLabel: { fontSize: 15, fontWeight: '700' },
  checkScore: { fontSize: 15, fontWeight: '800' },
  checkDetail: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
