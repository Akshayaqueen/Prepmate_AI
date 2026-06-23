/**
 * QuestionLibraryScreen — role-based frequently-asked questions + aptitude.
 * Tap a question to reveal a concise answer. Theme-aware.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppStore } from '../store/useAppStore';
import { ROLES, getRoleById } from '../data/roles';
import { getLibraryForRole } from '../data/questionLibrary';
import { palette, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import FadeInView from '../components/ui/FadeInView';

export default function QuestionLibraryScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const navigation = useNavigation<any>();

  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const setRole = useAppStore((s) => s.setRole);
  const role = getRoleById(selectedRoleId);
  const sections = getLibraryForRole(role.id);

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-left" size={24} iconColor={c.text} onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: c.text }]}>Question Library</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
          {ROLES.map((r) => {
            const active = r.id === role.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  setRole(r.id);
                  setExpanded(null);
                }}
                style={[styles.roleChip, { backgroundColor: active ? r.color : c.surface, borderColor: active ? r.color : c.border }]}
              >
                <MaterialCommunityIcons name={r.icon as any} size={18} color={active ? palette.white : r.color} />
                <Text style={[styles.roleChipText, { color: active ? palette.white : c.text }]}>{r.short}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {sections.map((section, si) => (
          <FadeInView key={section.category} delay={si * 60}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={section.icon as any} size={20} color={palette.primary} />
              <Text style={[styles.sectionTitle, { color: c.text }]}>{section.category}</Text>
              <View style={[styles.countPill, { backgroundColor: c.surfaceAlt }]}>
                <Text style={[styles.countText, { color: c.textMuted }]}>{section.questions.length}</Text>
              </View>
            </View>

            {section.questions.map((item, qi) => {
              const key = `${section.category}-${qi}`;
              const open = expanded === key;
              return (
                <Pressable key={key} onPress={() => setExpanded(open ? null : key)}>
                  <Surface style={[styles.qCard, { backgroundColor: c.surface }]} elevation={0}>
                    <View style={styles.qRow}>
                      <View style={[styles.tagChip, { backgroundColor: palette.primary + '14' }]}>
                        <Text style={[styles.tagText, { color: palette.primary }]}>{item.tag}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={c.textMuted}
                      />
                    </View>
                    <Text style={[styles.qText, { color: c.text }]}>{item.q}</Text>
                    {open && (
                      <View style={[styles.answerBox, { backgroundColor: c.bg, borderColor: c.border }]}>
                        <Text style={[styles.answerLabel, { color: palette.green }]}>Approach</Text>
                        <Text style={[styles.answerText, { color: c.textMuted }]}>{item.a}</Text>
                      </View>
                    )}
                  </Surface>
                </Pressable>
              );
            })}
          </FadeInView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },

  roleRow: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.lg },
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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  countPill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '700' },

  qCard: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  tagChip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: '800' },
  qText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  answerBox: { marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  answerLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  answerText: { fontSize: 14, lineHeight: 20 },
});
