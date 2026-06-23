/**
 * PrepMate AI — Settings Screen
 *
 * A polished profile/settings page. Lets users edit their profile
 * (industry, experience level, interview timeline, preferred persona,
 * notification time), toggle dark mode, and sign out.
 * Saves changes to Firestore `users/{userId}`.
 *
 * Validates: Requirements 8.3
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  Button,
  Surface,
  Chip,
  Switch,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../config/firebase';
import { signOut } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { useThemeMode, useColors } from '../theme/ThemeContext';
import { palette, gradients, spacing, radius, shadows } from '../theme/theme';
import GradientCard from '../components/ui/GradientCard';
import {
  Industry,
  ExperienceLevel,
  InterviewTimeline,
  Persona,
} from '../types';

// ─── Display Labels ──────────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<Industry, string> = {
  [Industry.Technology]: 'Technology',
  [Industry.Finance]: 'Finance',
  [Industry.Consulting]: 'Consulting',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  [ExperienceLevel.Student]: 'Student',
  [ExperienceLevel.Entry]: 'Entry-level',
  [ExperienceLevel.Mid]: 'Mid-level',
};

const TIMELINE_LABELS: Record<InterviewTimeline, string> = {
  [InterviewTimeline.ThisWeek]: 'This week',
  [InterviewTimeline.ThisMonth]: 'This month',
  [InterviewTimeline.NoDeadline]: 'No deadline',
};

const PERSONA_LABELS: Record<Persona, string> = {
  [Persona.Friendly]: 'Friendly Coach',
  [Persona.Tough]: 'Tough Challenger',
  [Persona.Technical]: 'Technical Griller',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useThemeMode();
  const c = useColors();
  const navigation = useNavigation<any>();

  const user = useAppStore((s) => s.user);
  const clearUser = useAppStore((s) => s.clearUser);

  // Local form state initialized from store
  const [industry, setIndustry] = useState<Industry>(user?.industry ?? Industry.Technology);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    user?.experienceLevel ?? ExperienceLevel.Student
  );
  const [timeline, setTimeline] = useState<InterviewTimeline>(
    user?.interviewTimeline ?? InterviewTimeline.NoDeadline
  );
  const [persona, setPersona] = useState<Persona>(user?.preferredPersona ?? Persona.Friendly);
  const [notificationTime, setNotificationTime] = useState<string>(
    user?.notificationTime ?? '09:00'
  );

  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Sync local state when user data changes in the store
  useEffect(() => {
    if (user) {
      setIndustry(user.industry);
      setExperienceLevel(user.experienceLevel);
      setTimeline(user.interviewTimeline);
      setPersona(user.preferredPersona);
      setNotificationTime(user.notificationTime);
    }
  }, [user]);

  // ─── Validation ──────────────────────────────────────────────────────────

  const isValidTime = (time: string): boolean => {
    const match = time.match(/^(\d{2}):(\d{2})$/);
    if (!match) return false;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  // ─── Save to Firestore ──────────────────────────────────────────────────

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setSnackbarMessage('Not signed in. Please sign in again.');
      setSnackbarVisible(true);
      return;
    }

    if (!isValidTime(notificationTime)) {
      setSnackbarMessage('Invalid time format. Use HH:mm (e.g., 09:00).');
      setSnackbarVisible(true);
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        industry,
        experienceLevel,
        interviewTimeline: timeline,
        preferredPersona: persona,
        notificationTime,
        updatedAt: serverTimestamp(),
      });

      // Update local store
      if (user) {
        useAppStore.getState().setUser({
          ...user,
          industry,
          experienceLevel,
          interviewTimeline: timeline,
          preferredPersona: persona,
          notificationTime,
        });
      }

      setSnackbarMessage('Settings saved successfully.');
      setSnackbarVisible(true);
    } catch (error) {
      // Demo mode (or offline) — surface feedback instead of crashing.
      setSnackbarMessage('Failed to save settings. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  // ─── Sign Out ────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            clearUser();
          } catch (error) {
            setSnackbarMessage('Failed to sign out. Please try again.');
            setSnackbarVisible(true);
          }
        },
      },
    ]);
  };

  // ─── Derived display values ────────────────────────────────────────────────

  const displayName = user?.displayName ?? 'Guest';
  const email = user?.email ?? '';
  const initial = (displayName.trim()[0] ?? 'G').toUpperCase();

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <GradientCard colors={gradients.brand} style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {displayName}
              </Text>
              {email ? (
                <Text style={styles.headerEmail} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
          </View>
        </GradientCard>

        {/* Preferences */}
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <SectionHeader icon="tune-vertical" title="Preferences" />

          <ChipRow
            icon="briefcase-outline"
            label="Industry"
            options={Object.values(Industry)}
            value={industry}
            getLabel={(v) => INDUSTRY_LABELS[v]}
            onSelect={(v) => setIndustry(v)}
          />
          <ChipRow
            icon="chart-line"
            label="Experience Level"
            options={Object.values(ExperienceLevel)}
            value={experienceLevel}
            getLabel={(v) => EXPERIENCE_LABELS[v]}
            onSelect={(v) => setExperienceLevel(v)}
          />
          <ChipRow
            icon="calendar-clock"
            label="Interview Timeline"
            options={Object.values(InterviewTimeline)}
            value={timeline}
            getLabel={(v) => TIMELINE_LABELS[v]}
            onSelect={(v) => setTimeline(v)}
          />
          <ChipRow
            icon="account-voice"
            label="Preferred Persona"
            options={Object.values(Persona)}
            value={persona}
            getLabel={(v) => PERSONA_LABELS[v]}
            onSelect={(v) => setPersona(v)}
            isLast
          />
        </Surface>

        {/* Notifications */}
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <SectionHeader icon="bell-outline" title="Notifications" />
          <View style={styles.notificationRow}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={22}
              color={palette.primary}
              style={styles.rowLeadingIcon}
            />
            <TextInput
              label="Reminder time (HH:mm)"
              value={notificationTime}
              onChangeText={setNotificationTime}
              mode="outlined"
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={[styles.timeInput, { backgroundColor: c.surface }]}
            />
          </View>
        </Surface>

        {/* Appearance */}
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <SectionHeader icon="palette-outline" title="Appearance" />
          <View style={styles.switchRow}>
            <MaterialCommunityIcons
              name={isDark ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color={palette.primary}
              style={styles.rowLeadingIcon}
            />
            <Text style={[styles.switchLabel, { color: c.text }]}>Dark Mode</Text>
            <Switch value={isDark} onValueChange={toggleTheme} color={palette.primary} />
          </View>
        </Surface>

        {/* More */}
        <Surface style={[styles.card, { backgroundColor: c.surface }]} elevation={0}>
          <SectionHeader icon="trophy-outline" title="More" />
          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('Achievements')}
          >
            <MaterialCommunityIcons
              name="trophy-award"
              size={22}
              color={palette.amber}
              style={styles.rowLeadingIcon}
            />
            <Text style={[styles.linkLabel, { color: c.text }]}>Achievements</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={c.textMuted} />
          </Pressable>
        </Surface>

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>

        {/* Sign Out */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          icon="logout"
          textColor={palette.error}
          style={styles.signOutButton}
          contentStyle={styles.saveButtonContent}
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* Feedback Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  const c = useColors();
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.slate} />
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
    </View>
  );
}

interface ChipRowProps<T extends string> {
  icon: any;
  label: string;
  options: T[];
  value: T;
  getLabel: (value: T) => string;
  onSelect: (value: T) => void;
  isLast?: boolean;
}

function ChipRow<T extends string>({
  icon,
  label,
  options,
  value,
  getLabel,
  onSelect,
  isLast,
}: ChipRowProps<T>) {
  const c = useColors();
  return (
    <View style={[styles.chipRow, { borderBottomColor: c.border }, isLast && styles.chipRowLast]}>
      <View style={styles.rowLabelLine}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={palette.primary}
          style={styles.rowLeadingIcon}
        />
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
      </View>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Chip
              key={option}
              selected={selected}
              showSelectedCheck={false}
              onPress={() => onSelect(option)}
              style={[
                styles.chip,
                { backgroundColor: c.surfaceAlt },
                selected && styles.chipSelected,
              ]}
              textStyle={[styles.chipText, { color: c.text }]}
            >
              {getLabel(option)}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.snow,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // Header
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '700',
  },
  headerEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
    marginLeft: spacing.sm,
  },

  // Chip rows
  chipRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.cloud,
  },
  chipRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowLabelLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowLeadingIcon: {
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 34,
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: palette.fog,
  },
  chipSelected: {
    backgroundColor: palette.primary,
  },
  chipText: {
    color: palette.slate,
  },
  chipTextSelected: {
    color: palette.white,
  },

  // Notifications
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: palette.white,
  },

  // Appearance
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.slate,
  },

  // Link rows
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.ink,
  },

  // Buttons
  saveButton: {
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  saveButtonContent: {
    paddingVertical: spacing.xs,
  },
  signOutButton: {
    borderRadius: radius.sm,
    borderColor: palette.error,
  },
});
