/**
 * CodingPracticeScreen — LeetCode-style problem + code editor (Part 1: editor
 * UI only, no execution). Pick a problem and language, edit starter code with
 * syntax highlighting, reset, or copy. Theme-aware chrome.
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, IconButton, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import CodeEditor, { CodeEditorSyntaxStyles } from '@rivascva/react-native-code-editor';

import {
  CODING_PROBLEMS,
  LANGUAGES,
  EditorLanguage,
  CodingProblem,
} from '../data/codingProblems';
import { palette, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';

const DIFF_COLOR: Record<CodingProblem['difficulty'], string> = {
  Easy: palette.green,
  Medium: palette.amber,
  Hard: palette.coral,
};

export default function CodingPracticeScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const navigation = useNavigation<any>();

  const [problemId, setProblemId] = useState(CODING_PROBLEMS[0].id);
  const [language, setLanguage] = useState<EditorLanguage>('javascript');
  const [code, setCode] = useState(CODING_PROBLEMS[0].starter.javascript);
  const [snack, setSnack] = useState('');

  const problem = useMemo(
    () => CODING_PROBLEMS.find((p) => p.id === problemId) ?? CODING_PROBLEMS[0],
    [problemId]
  );

  const loadStarter = (pid: string, lang: EditorLanguage) => {
    const p = CODING_PROBLEMS.find((x) => x.id === pid) ?? CODING_PROBLEMS[0];
    setCode(p.starter[lang]);
  };

  const onSelectProblem = (pid: string) => {
    setProblemId(pid);
    loadStarter(pid, language);
  };

  const onSelectLanguage = (lang: EditorLanguage) => {
    setLanguage(lang);
    loadStarter(problemId, lang);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setSnack('Code copied to clipboard');
  };

  const handleReset = () => {
    loadStarter(problemId, language);
    setSnack('Reset to starter code');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: c.border }]}>
        <IconButton icon="arrow-left" size={24} iconColor={c.text} onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: c.text }]}>Coding Practice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Problem selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CODING_PROBLEMS.map((p) => {
            const active = p.id === problemId;
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelectProblem(p.id)}
                style={[styles.problemChip, { backgroundColor: active ? palette.primary : c.surface, borderColor: active ? palette.primary : c.border }]}
              >
                <Text style={[styles.problemChipText, { color: active ? palette.white : c.text }]}>{p.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Problem statement */}
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <View style={styles.titleRow}>
            <Text style={[styles.problemTitle, { color: c.text }]}>{problem.title}</Text>
            <View style={[styles.diffChip, { backgroundColor: DIFF_COLOR[problem.difficulty] + '22' }]}>
              <Text style={[styles.diffText, { color: DIFF_COLOR[problem.difficulty] }]}>{problem.difficulty}</Text>
            </View>
          </View>
          <Text style={[styles.topic, { color: palette.primary }]}>{problem.topic}</Text>
          <Text style={[styles.statement, { color: c.textMuted }]}>{problem.statement}</Text>

          {problem.examples.map((ex, i) => (
            <View key={i} style={[styles.example, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.exLabel, { color: c.textMuted }]}>Example {i + 1}</Text>
              <Text style={[styles.exLine, { color: c.text }]}>Input: {ex.input}</Text>
              <Text style={[styles.exLine, { color: c.text }]}>Output: {ex.output}</Text>
            </View>
          ))}
        </Surface>

        {/* Language picker */}
        <View style={styles.langRow}>
          {LANGUAGES.map((l) => {
            const active = l.id === language;
            return (
              <Pressable
                key={l.id}
                onPress={() => onSelectLanguage(l.id)}
                style={[styles.langChip, { backgroundColor: active ? palette.ink : c.surface, borderColor: active ? palette.ink : c.border }]}
              >
                <Text style={[styles.langText, { color: active ? palette.white : c.text }]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Editor toolbar */}
        <View style={styles.editorBar}>
          <View style={styles.editorBarLeft}>
            <View style={styles.dot} />
            <View style={[styles.dot, { backgroundColor: palette.amber }]} />
            <View style={[styles.dot, { backgroundColor: palette.green }]} />
            <Text style={styles.editorFile}>solution.{extFor(language)}</Text>
          </View>
          <View style={styles.editorBarRight}>
            <Pressable onPress={handleReset} hitSlop={8} style={styles.toolBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color="#9CA3AF" />
            </Pressable>
            <Pressable onPress={handleCopy} hitSlop={8} style={styles.toolBtn}>
              <MaterialCommunityIcons name="content-copy" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Code editor */}
        <View style={styles.editorWrap}>
          <CodeEditor
            key={`${problemId}-${language}`}
            style={{
              fontSize: 14,
              inputLineHeight: 22,
              highlighterLineHeight: 22,
              minHeight: 320,
            }}
            language={language}
            syntaxStyle={CodeEditorSyntaxStyles.atomOneDark}
            showLineNumbers
            initialValue={code}
            onChange={setCode}
          />
        </View>

        <Text style={[styles.note, { color: c.textMuted }]}>
          Editor only — code execution & test cases can be added later via a sandbox API.
        </Text>
      </ScrollView>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={1800}>
        {snack}
      </Snackbar>
    </View>
  );
}

function extFor(lang: EditorLanguage): string {
  switch (lang) {
    case 'javascript':
      return 'js';
    case 'python':
      return 'py';
    case 'java':
      return 'java';
    case 'cpp':
      return 'cpp';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },

  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  problemChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  problemChipText: { fontSize: 13, fontWeight: '700' },

  card: { borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg, ...shadows.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  problemTitle: { fontSize: 18, fontWeight: '800' },
  diffChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  diffText: { fontSize: 11, fontWeight: '800' },
  topic: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  statement: { fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  example: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, marginTop: spacing.md },
  exLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  exLine: { fontSize: 13, fontFamily: 'monospace', marginTop: 2 },

  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  langChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, borderWidth: 1.5 },
  langText: { fontSize: 13, fontWeight: '700' },

  editorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#21252B',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editorBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: palette.coral },
  editorFile: { color: '#9CA3AF', fontSize: 12, marginLeft: spacing.sm, fontWeight: '600' },
  editorBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toolBtn: { padding: 2 },

  editorWrap: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    overflow: 'hidden',
    minHeight: 320,
  },
  note: { fontSize: 12, marginTop: spacing.lg, textAlign: 'center', fontStyle: 'italic' },
});
