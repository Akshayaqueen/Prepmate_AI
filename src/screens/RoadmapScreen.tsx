/**
 * RoadmapScreen — Personalized, role-based preparation roadmap.
 *
 * Pick a target role (SDE, CSA, Data Analyst, …) and follow a staged
 * roadmap. Stage completion is derived from total sessions (demo) so the
 * timeline feels alive. Fully theme-aware (light/dark).
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppStore } from '../store/useAppStore';
import { ROLES, getRoleById } from '../data/roles';
import { palette, gradients, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import GradientCard from '../components/ui/GradientCard';
import FadeInView from '../components/ui/FadeInView';

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const navigation = useNavigation<any>();

  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const setRole = useAppStore((s) => s.setRole);
  const gamification = useAppStore((s) => s.gamification);
  const totalSessions = gamification?.totalSessions ?? 0;

  const role = getRoleById(selectedRoleId);

  // Demo completion: 2 sessions advance one stage.
  const completedStages = Math.min(role.roadmap.length, Math.floor(totalSessions / 2));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView delay={0}>
        <Text style={[styles.title, { color: c.text }]}>Prep Roadmap</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Choose your target role to personalize
        </Text>
      </FadeInView>

      {/* Role selector */}
      <FadeInView delay={80}>
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
                  name={(r.icon as any) || 'briefcase'}
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
      </FadeInView>

      {/* Role header */}
      <FadeInView delay={160}>
        <GradientCard colors={[role.color, role.color + 'CC']} style={styles.roleHeader}>
          <View style={styles.roleHeaderRow}>
            <View style={styles.roleIconWrap}>
              <MaterialCommunityIcons name={(role.icon as any) || 'briefcase'} size={28} color={palette.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleTagline}>{role.tagline}</Text>
            </View>
          </View>
          <View style={styles.roleProgressRow}>
            <Text style={styles.roleProgressText}>
              {completedStages}/{role.roadmap.length} stages complete
            </Text>
          </View>
        </GradientCard>
      </FadeInView>

      {/* Focus areas */}
      <FadeInView delay={240}>
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Focus Areas</Text>
          <View style={styles.focusWrap}>
            {role.focusAreas.map((f) => (
              <View key={f.label} style={[styles.focusChip, { backgroundColor: role.color + '1A' }]}>
                <Text style={[styles.focusChipText, { color: role.color }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Surface>
      </FadeInView>

      {/* Roadmap timeline */}
      <FadeInView delay={320}>
        <Text style={[styles.sectionTitle, { color: c.text, marginBottom: spacing.md }]}>
          Your Path
        </Text>
        {role.roadmap.map((stage, i) => {
          const done = i < completedStages;
          const current = i === completedStages;
          return (
            <Surface key={i} style={[styles.stageCard, { backgroundColor: c.surface }]} elevation={0}>
              <View style={styles.stageLeft}>
                <View
                  style={[
                    styles.stageNode,
                    {
                      backgroundColor: done ? palette.green : current ? role.color : c.surfaceAlt,
                      borderColor: current ? role.color : 'transparent',
                    },
                  ]}
                >
                  {done ? (
                    <MaterialCommunityIcons name="check" size={18} color={palette.white} />
                  ) : (
                    <Text style={[styles.stageNum, { color: current ? palette.white : c.textMuted }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < role.roadmap.length - 1 && (
                  <View style={[styles.stageLine, { backgroundColor: done ? palette.green : c.border }]} />
                )}
              </View>
              <View style={styles.stageBody}>
                <View style={styles.stageHeader}>
                  <Text style={[styles.stageTitle, { color: c.text }]}>{stage.title}</Text>
                  {current && (
                    <View style={[styles.currentTag, { backgroundColor: role.color + '22' }]}>
                      <Text style={[styles.currentTagText, { color: role.color }]}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.stageDesc, { color: c.textMuted }]}>{stage.description}</Text>
                <View style={styles.skillWrap}>
                  {stage.skills.map((s) => (
                    <View key={s} style={[styles.skillChip, { backgroundColor: c.surfaceAlt }]}>
                      <Text style={[styles.skillChipText, { color: c.textMuted }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Surface>
          );
        })}
      </FadeInView>

      <FadeInView delay={400}>
        <Button
          mode="contained"
          icon="microphone"
          onPress={() => navigation.navigate('Practice')}
          style={styles.cta}
          contentStyle={{ paddingVertical: spacing.sm }}
          buttonColor={role.color}
        >
          Practice for {role.short}
        </Button>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },

  roleRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.xl },
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

  roleHeader: { marginTop: spacing.lg, marginBottom: spacing.xl },
  roleHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: { fontSize: 18, fontWeight: '800', color: palette.white },
  roleTagline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  roleProgressRow: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  roleProgressText: { color: palette.white, fontWeight: '700', fontSize: 13 },

  card: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.sm },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  focusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  focusChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  focusChipText: { fontSize: 12, fontWeight: '700' },

  stageCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  stageLeft: { alignItems: 'center', marginRight: spacing.md },
  stageNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stageNum: { fontSize: 15, fontWeight: '800' },
  stageLine: { width: 2, flex: 1, marginTop: 4, minHeight: 24 },
  stageBody: { flex: 1 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stageTitle: { fontSize: 15, fontWeight: '700' },
  currentTag: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  currentTagText: { fontSize: 10, fontWeight: '800' },
  stageDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  skillChip: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  skillChipText: { fontSize: 11, fontWeight: '600' },

  cta: { borderRadius: radius.lg, marginTop: spacing.sm, ...shadows.glow },
});
