/**
 * SessionScreen — "PrepMate AI Interview Panel"
 *
 * Chat-style mock interview with rounds (1 of 5). The AI interviewer asks
 * role-specialised questions; the candidate answers by voice (when available)
 * or text. Each answer is analysed on-device; after the final round (or on
 * End) a summary is computed and the user is routed to Results.
 *
 * Requirements: 1.1, 1.2, 3.1
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../store/useAppStore';
import { analyzeTurn } from '../services/speechAnalyzer';
import { getConfidenceCategory } from '../services/confidenceScore';
import { getQuestionForRole } from '../data/questionBank';
import { getRoleById } from '../data/roles';
import { SpeechMetrics, Difficulty } from '../types';
import type { SessionResultsParams } from '../navigation/AppNavigator';

import { palette, spacing, radius } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';

// Optional React Native Voice (absent on web / Expo Go)
let Voice: any = null;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  // text fallback used
}

const TOTAL_ROUNDS = 5;

interface ChatMessage {
  from: 'ai' | 'user';
  text: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Foundational',
  intermediate: 'Technical',
  advanced: 'Advanced',
};

export default function SessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const c = useColors();

  const session = route.params?.session;
  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const role = getRoleById(selectedRoleId);
  const difficulty: Difficulty = session?.difficulty ?? Difficulty.Intermediate;
  const sessionType = DIFFICULTY_LABEL[difficulty] ?? 'Technical';

  const firstQuestion: string =
    session?.question ?? getQuestionForRole(role.questionTags, 0).text;

  const { isRecording, setRecording, setLiveSpeechMetrics, liveSpeechMetrics } = useAppStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'ai', text: firstQuestion },
  ]);
  const [round, setRound] = useState(1);
  const [allMetrics, setAllMetrics] = useState<SpeechMetrics[]>([]);
  const [draft, setDraft] = useState('');
  const [partial, setPartial] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const recordStartRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

  // ─── Voice setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (Voice) {
      Voice.isAvailable()
        .then((a: any) => setVoiceAvailable(!!a))
        .catch(() => setVoiceAvailable(false));
      Voice.onSpeechResults = (e: any) => e?.value?.[0] && setDraft(e.value[0]);
      Voice.onSpeechPartialResults = (e: any) => e?.value?.[0] && setPartial(e.value[0]);
      Voice.onSpeechError = () => stopRecording();
    }
    return () => {
      if (Voice) {
        try {
          Voice.destroy().then(() => Voice.removeAllListeners());
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, isThinking]);

  // ─── Recording ───────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!voiceAvailable || !Voice) return;
    try {
      setDraft('');
      setPartial('');
      recordStartRef.current = Date.now();
      await Voice.start('en-US');
      setRecording(true);
    } catch {
      setVoiceAvailable(false);
    }
  };

  const stopRecording = async () => {
    if (Voice && isRecording) {
      try {
        await Voice.stop();
      } catch {}
    }
    setRecording(false);
    const dur = (Date.now() - recordStartRef.current) / 1000;
    const text = (draft || partial).trim();
    if (text.length > 0) submitAnswer(text, Math.max(dur, 1));
  };

  // ─── Submit a round ────────────────────────────────────────────────────────
  const submitAnswer = useCallback(
    (text: string, durationSeconds?: number) => {
      const wordCount = text.split(/\s+/).length;
      const dur = durationSeconds ?? Math.max(5, (wordCount / 150) * 60);
      const metrics = analyzeTurn(text, dur);
      setLiveSpeechMetrics(metrics);
      setAllMetrics((prev) => [...prev, metrics]);

      const answeredRound = round;
      setMessages((prev) => [...prev, { from: 'user', text }]);
      setDraft('');
      setPartial('');

      if (answeredRound >= TOTAL_ROUNDS) {
        setTimeout(() => endSession([...allMetrics, metrics]), 600);
        return;
      }

      setIsThinking(true);
      setTimeout(() => {
        const next = getQuestionForRole(role.questionTags, answeredRound);
        setMessages((prev) => [...prev, { from: 'ai', text: next.text }]);
        setRound(answeredRound + 1);
        setIsThinking(false);
      }, 1100);
    },
    [round, role, allMetrics, setLiveSpeechMetrics]
  );

  const handleSubmitText = () => {
    const text = draft.trim();
    if (text.length === 0) return;
    submitAnswer(text);
  };

  // ─── End session → Results ─────────────────────────────────────────────────
  const endSession = (metrics: SpeechMetrics[]) => {
    const fillerCount = metrics.reduce((s, m) => s + m.fillerCount, 0);
    const lastAnxiety = metrics.length ? metrics[metrics.length - 1].anxietyScore : 30;
    const avgStar = metrics.length
      ? Math.max(40, Math.min(90, Math.round(metrics.reduce((s, m) => s + (100 - m.anxietyScore), 0) / metrics.length)))
      : 65;
    const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const confidenceScore = Math.round((100 - lastAnxiety) * 0.6 + avgStar * 0.4);

    const results: SessionResultsParams = {
      confidenceScore,
      confidenceCategory: getConfidenceCategory(confidenceScore),
      avgStarScore: avgStar,
      anxietyReading: lastAnxiety,
      fillerCount,
      sessionDuration,
      topSuggestions: [
        fillerCount > 3
          ? 'Trim filler words — a short pause reads as confidence.'
          : 'Lead with a crisp Situation and Task to frame each answer.',
        'Close every answer with a quantified Result to land your impact.',
      ],
      xpAwarded: 20,
    };
    navigation.navigate('Results', { results });
  };

  const handleEndEarly = () => {
    Alert.alert('End interview?', 'Your results will be calculated from completed rounds.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => endSession(allMetrics) },
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  const liveWpm = liveSpeechMetrics?.wpm;
  const liveFillers = liveSpeechMetrics?.fillerCount;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>PrepMate AI Interview Panel</Text>
          <Text style={[styles.headerSub, { color: c.textMuted }]} numberOfLines={1}>
            Session: {role.title} ({sessionType})
          </Text>
        </View>
        <View style={[styles.roundPill, { backgroundColor: palette.primary + '22' }]}>
          <Text style={[styles.roundPillText, { color: palette.primary }]}>
            Round {Math.min(round, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}
          </Text>
        </View>
      </View>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.chat}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) =>
          m.from === 'ai' ? (
            <View key={i} style={[styles.aiBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.aiHeader}>
                <MaterialCommunityIcons name="robot-happy" size={16} color={palette.primary} />
                <Text style={[styles.aiName, { color: palette.primary }]}>Interviewer AI</Text>
              </View>
              <Text style={[styles.aiText, { color: c.text }]}>{m.text}</Text>
            </View>
          ) : (
            <View key={i} style={styles.userBubble}>
              <Text style={styles.userText}>{m.text}</Text>
            </View>
          )
        )}

        {isThinking && (
          <View style={[styles.aiBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.aiHeader}>
              <ActivityIndicator size={14} color={palette.primary} />
              <Text style={[styles.aiName, { color: palette.primary }]}>Interviewer is thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Live mic metrics (while/after recording) */}
      {isRecording && (
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>
            Listening… {liveWpm ? `${Math.round(liveWpm)} WPM` : ''} {liveFillers ? `· ${liveFillers} fillers` : ''}
          </Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: c.surface, borderTopColor: c.border, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={[styles.inputRow, { backgroundColor: c.bg, borderColor: c.border }]}>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Speak or write your professional response…"
            placeholderTextColor={c.textMuted}
            value={isRecording ? partial : draft}
            onChangeText={setDraft}
            multiline
            editable={!isRecording && !isThinking}
          />
          {voiceAvailable && (
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isThinking}
              style={[styles.micBtn, { backgroundColor: isRecording ? palette.coral : palette.primary }]}
            >
              <MaterialCommunityIcons name={isRecording ? 'stop' : 'microphone'} size={20} color={palette.white} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={handleSubmitText}
          disabled={draft.trim().length === 0 || isThinking || isRecording}
          style={[
            styles.submitBtn,
            { backgroundColor: palette.primary, opacity: draft.trim().length === 0 || isThinking || isRecording ? 0.5 : 1 },
          ]}
        >
          <Text style={styles.submitText}>Submit professional statement</Text>
        </Pressable>

        <Pressable onPress={handleEndEarly} style={styles.endLink}>
          <Text style={[styles.endLinkText, { color: c.textMuted }]}>End interview early</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },
  roundPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  roundPillText: { fontSize: 11, fontWeight: '800' },

  chat: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  aiBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    borderRadius: radius.lg,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    padding: spacing.lg,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  aiName: { fontSize: 12, fontWeight: '800' },
  aiText: { fontSize: 15, lineHeight: 22 },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: palette.primary,
    borderRadius: radius.lg,
    borderTopRightRadius: 4,
    padding: spacing.lg,
  },
  userText: { fontSize: 15, lineHeight: 22, color: palette.white },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.coral },
  liveText: { fontSize: 13, fontWeight: '600', color: palette.coral },

  inputBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: spacing.sm },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  submitBtn: {
    marginTop: spacing.md,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitText: { color: palette.white, fontWeight: '800', fontSize: 15 },
  endLink: { alignItems: 'center', paddingVertical: spacing.md },
  endLinkText: { fontSize: 13, fontWeight: '600' },
});
