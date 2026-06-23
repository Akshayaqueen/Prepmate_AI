import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

export interface MilestoneCelebrationProps {
  /** Type of milestone reached */
  type: 'week' | 'month';
  /** Current streak count */
  streak: number;
  /** Whether the celebration modal is visible */
  visible: boolean;
  /** Callback to dismiss the celebration */
  onDismiss: () => void;
}

/**
 * Milestone celebration modal shown when the user hits
 * streak = 7 (weekly) or streak = 30 (monthly).
 *
 * Includes an animated emoji, congratulatory message,
 * and a shareable achievement card.
 *
 * Requirements: 7.4
 */
export default function MilestoneCelebration({
  type,
  streak,
  visible,
  onDismiss,
}: MilestoneCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const emoji = type === 'week' ? '🎉' : '🏆';
  const title = type === 'week' ? '7 Day Streak!' : '30 Day Streak!';
  const subtitle = "You're on fire! Keep up the great work!";
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Celebration emoji */}
          <Text style={styles.emoji}>{emoji}</Text>

          {/* Title and subtitle */}
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {subtitle}
          </Text>

          {/* Shareable achievement card */}
          <Surface style={styles.achievementCard} elevation={3}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {streak} Day Streak
            </Text>
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              PrepMate AI
            </Text>
            <Text variant="bodySmall" style={styles.cardDate}>
              {today}
            </Text>
          </Surface>

          {/* Dismiss button */}
          <Button
            mode="contained"
            onPress={onDismiss}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            Continue
          </Button>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#6B7280',
    marginBottom: 4,
  },
  cardDate: {
    color: '#9CA3AF',
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    paddingVertical: 4,
  },
});
