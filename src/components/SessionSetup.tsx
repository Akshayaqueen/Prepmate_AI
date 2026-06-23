/**
 * SessionSetup — Persona and difficulty selection before starting an interview session.
 *
 * Displays 3 persona cards with descriptions, a difficulty selector,
 * and a "Start Interview" button that calls POST /startSession.
 *
 * Resilient by design: if the backend is unavailable (demo mode), it falls
 * back to the offline question bank so Practice always works.
 *
 * Requirements: 2.1, 1.1
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Persona, Difficulty, Industry } from '../types';
import { useAppStore } from '../store/useAppStore';
import { getQuestionForRole } from '../data/questionBank';
import { getRoleById, ROLES } from '../data/roles';
import { palette, gradients, personaGradients, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';

// ─── Cloud Functions base URL ────────────────────────────────────────────────
// Replace with your actual Firebase Cloud Functions URL when deployed.
const CLOUD_FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_CLOUD_FUNCTIONS_URL || 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net';

// ─── Persona card data ───────────────────────────────────────────────────────

type PersonaGradientKey = keyof typeof personaGradients;

interface PersonaOption {
  id: Persona;
  gradientKey: PersonaGradientKey;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: Persona.Friendly,
    gradientKey: 'friendly',
    title: 'Friendly Coach',
    icon: 'emoticon-happy-outline',
    description: 'Encouraging, supportive, patient',
  },
  {
    id: Persona.Tough,
    gradientKey: 'tough',
    title: 'Tough Challenger',
    icon: 'sword-cross',
    description: 'Challenging, probing, intense',
  },
  {
    id: Persona.Technical,
    gradientKey: 'technical',
    title: 'Technical Griller',
    icon: 'code-tags',
    description: 'Technical depth, edge cases, tradeoffs',
  },
];

// ─── Difficulty options ──────────────────────────────────────────────────────

interface DifficultyOption {
  id: Difficulty;
  label: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: Difficulty.Beginner, label: 'Beginner' },
  { id: Difficulty.Intermediate, label: 'Intermediate' },
  { id: Difficulty.Advanced, label: 'Advanced' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SessionSetup() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { user, setError } = useAppStore();
  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const setRole = useAppStore((s) => s.setRole);
  const role = getRoleById(selectedRoleId);

  const [selectedPersona, setSelectedPersona] = useState<Persona>(Persona.Friendly);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.Beginner);
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSession = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/startSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.email ?? 'anonymous',
          persona: selectedPersona,
          industry: user?.industry ?? Industry.Technology,
          difficulty: selectedDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Navigate to the active session view with the session data
      navigation.navigate('Session', {
        session: {
          sessionId: data.sessionId,
          question: data.question,
          questionType: data.questionType,
          persona: selectedPersona,
          difficulty: selectedDifficulty,
        },
      });
    } catch (error: any) {
      // Demo mode / no backend — fall back to the offline question bank
      // so Practice still works end to end.
      const q = getQuestionForRole(role.questionTags, 0);
      const session = {
        sessionId: 'demo-' + Date.now(),
        question: q.text,
        questionType: q.type,
        persona: selectedPersona,
        difficulty: selectedDifficulty,
      };
      navigation.navigate('Session', { session });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text variant="headlineMedium" style={[styles.title, { color: c.text }]}>
        AI Mock Interview
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: c.textMuted }]}>
        Choose your role, then launch the simulation
      </Text>

      {/* Role selector */}
      <Text style={[styles.pickerLabel, { color: c.text }]}>Target Role</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleRow}
      >
        {ROLES.map((r) => {
          const active = r.id === role.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRole(r.id)}
              style={[
                styles.roleChip,
                { backgroundColor: active ? r.color : c.surface, borderColor: active ? r.color : c.border },
              ]}
            >
              <MaterialCommunityIcons
                name={r.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={18}
                color={active ? palette.white : r.color}
              />
              <Text style={[styles.roleChipText, { color: active ? palette.white : c.text }]}>
                {r.short}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Persona Cards */}
      <Text style={[styles.pickerLabel, { color: c.text, marginTop: spacing.xl }]}>
        Interviewer Style
      </Text>
      <View style={styles.personaSection}>
        {PERSONA_OPTIONS.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          const personaColors = personaGradients[persona.gradientKey];

          const cardInner = (
            <View style={styles.personaContent}>
              <View
                style={[
                  styles.iconBadge,
                  isSelected ? styles.iconBadgeSelected : { backgroundColor: palette.fog },
                ]}
              >
                <MaterialCommunityIcons
                  name={persona.icon}
                  size={26}
                  color={isSelected ? palette.white : personaColors[0]}
                />
              </View>

              <View style={styles.personaText}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.personaTitle,
                    !isSelected && { color: c.text },
                    isSelected && styles.personaTextSelected,
                  ]}
                >
                  {persona.title}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.personaDescription,
                    !isSelected && { color: c.textMuted },
                    isSelected && styles.personaDescriptionSelected,
                  ]}
                >
                  {persona.description}
                </Text>
              </View>

              <MaterialCommunityIcons
                name={isSelected ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={24}
                color={isSelected ? palette.white : palette.cloud}
              />
            </View>
          );

          return (
            <Pressable
              key={persona.id}
              onPress={() => setSelectedPersona(persona.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${persona.title}: ${persona.description}`}
              style={({ pressed }) => [styles.personaCardWrapper, pressed && styles.pressed]}
            >
              {isSelected ? (
                <LinearGradient
                  colors={personaColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.personaCard, styles.personaCardSelected]}
                >
                  {cardInner}
                </LinearGradient>
              ) : (
                <View style={[styles.personaCard, styles.personaCardUnselected, { backgroundColor: c.surface, borderColor: c.border }]}>{cardInner}</View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Difficulty Selector */}
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: c.text }]}>
        Difficulty
      </Text>
      <View style={styles.difficultyRow}>
        {DIFFICULTY_OPTIONS.map((option) => {
          const isSelected = selectedDifficulty === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setSelectedDifficulty(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.difficultyChip,
                isSelected
                  ? styles.difficultyChipSelected
                  : [styles.difficultyChipUnselected, { backgroundColor: c.surface, borderColor: c.border }],
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.difficultyText,
                  isSelected
                    ? styles.difficultyTextSelected
                    : [styles.difficultyTextUnselected, { color: c.text }],
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Start Button */}
      <Pressable
        onPress={handleStartSession}
        disabled={isStarting}
        accessibilityRole="button"
        accessibilityLabel="Start Interview"
        accessibilityState={{ disabled: isStarting }}
        style={({ pressed }) => [
          styles.startButton,
          isStarting && styles.startButtonDisabled,
          pressed && !isStarting && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButtonGradient}
        >
          {isStarting ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <MaterialCommunityIcons name="play-circle" size={24} color={palette.white} />
          )}
          <Text style={styles.startButtonLabel}>
            {isStarting ? 'Launching…' : 'Launch Simulation'}
          </Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.snow,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontWeight: '800',
    color: palette.ink,
    textAlign: 'center',
  },
  subtitle: {
    color: palette.gray,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginBottom: spacing.xl,
  },
  roleBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  roleRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xl,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  roleChipText: { fontSize: 13, fontWeight: '700' },
  personaSection: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  personaCardWrapper: {
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  personaCard: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  personaCardSelected: {
    ...shadows.md,
  },
  personaCardUnselected: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.cloud,
    ...shadows.sm,
  },
  personaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  personaText: {
    flex: 1,
  },
  personaTitle: {
    fontWeight: '700',
    color: palette.ink,
  },
  personaTextSelected: {
    color: palette.white,
  },
  personaDescription: {
    color: palette.gray,
    marginTop: 2,
  },
  personaDescriptionSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontWeight: '700',
    color: palette.ink,
    marginBottom: spacing.md,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  difficultyChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyChipUnselected: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.cloud,
  },
  difficultyChipSelected: {
    backgroundColor: palette.primary,
    ...shadows.sm,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyTextUnselected: {
    color: palette.slate,
  },
  difficultyTextSelected: {
    color: palette.white,
  },
  startButton: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadows.glow,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  startButtonLabel: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
