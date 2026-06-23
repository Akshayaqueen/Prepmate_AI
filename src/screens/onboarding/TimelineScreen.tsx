/**
 * PrepMate AI — Timeline Selection Screen (Onboarding Step 3)
 *
 * Allows user to select their interview timeline: This week, This month, or No deadline.
 * On completion, writes profile data to Firestore and triggers navigation to main stack.
 *
 * Validates: Requirements 8.1, 8.2
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, RadioButton, Button } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { InterviewTimeline } from '../../types';
import { auth, db } from '../../config/firebase';

type TimelineScreenRouteProp = RouteProp<AuthStackParamList, 'Timeline'>;

const TIMELINE_OPTIONS: { value: InterviewTimeline; label: string }[] = [
  { value: InterviewTimeline.ThisWeek, label: 'This week' },
  { value: InterviewTimeline.ThisMonth, label: 'This month' },
  { value: InterviewTimeline.NoDeadline, label: 'No deadline' },
];

export default function TimelineScreen() {
  const route = useRoute<TimelineScreenRouteProp>();
  const [selected, setSelected] = useState<InterviewTimeline | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDone = async () => {
    if (!selected) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be signed in to complete onboarding.');
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        industry: route.params.industry,
        experienceLevel: route.params.experienceLevel,
        interviewTimeline: selected,
        updatedAt: serverTimestamp(),
      });
      // Navigation to HomeScreen is handled by the auth state listener in AppNavigator
      // which detects that the user profile is now complete.
    } catch (error) {
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          When's your interview?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          We'll pace your preparation accordingly.
        </Text>

        <RadioButton.Group
          onValueChange={(value) => setSelected(value as InterviewTimeline)}
          value={selected}
        >
          {TIMELINE_OPTIONS.map((option) => (
            <RadioButton.Item
              key={option.value}
              label={option.label}
              value={option.value}
              style={styles.radioItem}
              labelStyle={styles.radioLabel}
              accessibilityLabel={option.label}
            />
          ))}
        </RadioButton.Group>
      </View>

      <Button
        mode="contained"
        onPress={handleDone}
        disabled={!selected || isLoading}
        loading={isLoading}
        style={styles.button}
        accessibilityLabel="Done"
      >
        Done
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 32,
  },
  radioItem: {
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  radioLabel: {
    fontSize: 16,
  },
  button: {
    marginTop: 16,
  },
});
