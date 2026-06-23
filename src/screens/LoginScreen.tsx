/**
 * PrepMate AI — Login Screen
 *
 * Email/password sign-in/sign-up form with Google sign-in.
 * Uses React Native Paper components over a branded gradient hero.
 *
 * Validates: Requirements 8.4
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { signUp, signIn, signInWithGoogle } from '../services/auth';
import { useAppStore } from '../store/useAppStore';
import { palette, gradients, spacing, radius, shadows } from '../theme/theme';
import {
  Industry,
  ExperienceLevel,
  InterviewTimeline,
  Persona,
} from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const setUser = useAppStore((s) => s.setUser);
  const setGamification = useAppStore((s) => s.setGamification);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleEmailAuth = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, displayName.trim());
        // Navigate to onboarding after sign-up
        navigation.navigate('Industry');
      } else {
        await signIn(email.trim(), password);
        // On sign-in, the auth state listener in AppNavigator handles navigation
      }
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Auth state listener handles navigation
    } catch (err: any) {
      const message = getErrorMessage(err.code);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Demo login — bypasses Firebase so the app can be explored without
   * backend credentials. Sets a mock user in the store, which flips
   * `isAuthenticated` and navigates to the main app.
   */
  const handleDemoLogin = () => {
    setError(null);
    // Seed demo gamification data so the dashboard renders immediately
    // (no Firestore round-trip needed).
    setGamification({
      currentStreak: 3,
      longestStreak: 5,
      lastPracticeDate: new Date().toISOString().split('T')[0],
      totalXP: 150,
      level: 2,
      totalSessions: 8,
    });
    setUser({
      email: 'demo@prepmate.ai',
      displayName: 'Demo User',
      industry: Industry.Technology,
      experienceLevel: ExperienceLevel.Student,
      interviewTimeline: InterviewTimeline.NoDeadline,
      preferredPersona: Persona.Friendly,
      notificationTime: '09:00',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — sits on the gradient */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="microphone-variant"
              size={40}
              color={palette.primary}
            />
          </View>
          <Text variant="headlineLarge" style={styles.brand}>
            PrepMate AI
          </Text>
          <Text variant="bodyLarge" style={styles.tagline}>
            Ace your next interview
          </Text>
        </View>

        {/* Form card — slides up over the gradient */}
        <View style={[styles.card, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text variant="titleLarge" style={styles.cardHeading}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </Text>
          <Text variant="bodyMedium" style={styles.cardSubheading}>
            {isSignUp
              ? 'Start practicing in seconds'
              : 'Sign in to continue your prep'}
          </Text>

          <View style={styles.form}>
            {isSignUp && (
              <TextInput
                label="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="account-outline" />}
                autoCapitalize="words"
                accessibilityLabel="Full Name"
              />
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="email-outline" />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye-off' : 'eye'}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
              accessibilityLabel="Password"
            />

            {error && (
              <HelperText type="error" visible={!!error} style={styles.error}>
                {error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleEmailAuth}
              loading={isLoading}
              disabled={isLoading}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
              accessibilityLabel={isSignUp ? 'Sign Up' : 'Sign In'}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              style={styles.outlinedButton}
              contentStyle={styles.buttonContent}
              icon="google"
              accessibilityLabel="Sign in with Google"
            >
              Sign in with Google
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              style={styles.toggleButton}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="labelSmall" style={styles.dividerText}>
                OR
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              mode="contained-tonal"
              onPress={handleDemoLogin}
              disabled={isLoading}
              style={styles.demoButton}
              contentStyle={styles.buttonContent}
              icon="rocket-launch"
              accessibilityLabel="Continue as Demo"
            >
              Continue as Demo (no account)
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  // ─── Hero ──────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  brand: {
    fontWeight: '800',
    color: palette.white,
    letterSpacing: 0.5,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  },
  // ─── Card ──────────────────────────────────────────────
  card: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  cardHeading: {
    fontWeight: '800',
    color: palette.ink,
  },
  cardSubheading: {
    color: palette.gray,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: palette.white,
  },
  inputOutline: {
    borderRadius: radius.md,
  },
  error: {
    marginBottom: spacing.xs,
  },
  // ─── Buttons ───────────────────────────────────────────
  primaryButton: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    ...shadows.glow,
  },
  primaryButtonContent: {
    paddingVertical: spacing.sm,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  outlinedButton: {
    marginTop: spacing.md,
    borderRadius: radius.pill,
    borderColor: palette.cloud,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  toggleButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.cloud,
  },
  dividerText: {
    color: palette.mist,
    marginHorizontal: spacing.md,
    letterSpacing: 1,
  },
  demoButton: {
    borderRadius: radius.pill,
  },
});
