/**
 * CheatsheetsScreen — role-based quick-reference cheatsheets. Theme-aware.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppStore } from '../store/useAppStore';
import { ROLES, getRoleById } from '../data/roles';
import { getCheatsheetsForRole } from '../data/cheatsheets';
import { palette, spacing, radius, shadows } from '../theme/theme';
import { useColors } from '../theme/ThemeContext';
import FadeInView from '../components/ui/FadeInView';

export default function CheatsheetsScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const navigation = useNavigation<any>();

  const selectedRoleId = useAppStore((s) => s.selectedRoleId);
  const setRole = useAppStore((s) => s.setRole);
  const role = getRoleById(selectedRoleId);
  const sheets = getCheatsheetsForRole(role.id);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-left" size={24} iconColor={c.text} onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { color: c.text }]}>Cheatsheets</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleRow}>
          {ROLES.map((r) => {
            const active = r.id === role.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[styles.roleChip, { backgroundColor: active ? r.color : c.surface, borderColor: active ? r.color : c.border }]}
              >
                <MaterialCommunityIcons name={r.icon as any} size={18} color={active ? palette.white : r.color} />
                <Text style={[styles.roleChipText, { color: active ? palette.white : c.text }]}>{r.short}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {sheets.map((sheet, si) => (
          <FadeInView key={sheet.title} delay={si * 80}>
            <Surface style={[styles.sheetCard, { backgroundColor: c.surface }]} elevation={0}>
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetIcon, { backgroundColor: role.color + '1A' }]}>
                  <MaterialCommunityIcons name={sheet.icon as any} size={22} color={role.color} />
                </View>
                <Text style={[styles.sheetTitle, { color: c.text }]}>{sheet.title}</Text>
              </View>
              {sheet.items.map((item, ii) => (
                <View key={ii} style={[styles.itemRow, { borderTopColor: c.border }, ii === 0 && styles.firstItem]}>
                  <Text style={[styles.term, { color: c.text }]}>{item.term}</Text>
                  <Text style={[styles.detail, { color: c.textMuted }]}>{item.detail}</Text>
                </View>
              ))}
            </Surface>
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

  sheetCard: { borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadows.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  sheetIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 16, fontWeight: '800' },

  itemRow: { flexDirection: 'row', paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md },
  firstItem: { borderTopWidth: 0 },
  term: { fontSize: 14, fontWeight: '800', width: 130 },
  detail: { fontSize: 14, flex: 1, lineHeight: 20 },
});
