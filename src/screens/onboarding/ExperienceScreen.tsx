/**
 * PrepMate AI — Experience Level Screen (Onboarding Step 2)
 *
 * Allows user to select their experience level: Student, Entry-level, or Mid-level.
 * Navigates to TimelineScreen on completion.
 *
 * Validates: Requirements 8.1, 8.2
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, RadioButton, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { ExperienceLevel } from '../../types';

type ExperienceScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Experience'>;
type ExperienceScreenRouteProp = RouteProp<AuthStackParamList, 'Experience'>;

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: ExperienceLevel.Student, label: 'Student' },
  { value: ExperienceLevel.Entry, label: 'Entry-level' },
  { value: ExperienceLevel.Mid, label: 'Mid-level' },
];

export default function ExperienceScreen() {
  const navigation = useNavigation<ExperienceScreenNavigationProp>();
  const route = useRoute<ExperienceScreenRouteProp>();
  const [selected, setSelected] = useState<ExperienceLevel | ''>('');

  const handleNext = () => {
    if (selected) {
      navigation.navigate('Timeline', {
        industry: route.params.industry,
        experienceLevel: selected,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          What's your experience level?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          This helps us set the right difficulty for your practice.
        </Text>

        <RadioButton.Group
          onValueChange={(value) => setSelected(value as ExperienceLevel)}
          value={selected}
        >
          {EXPERIENCE_OPTIONS.map((option) => (
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
        onPress={handleNext}
        disabled={!selected}
        style={styles.button}
        accessibilityLabel="Next"
      >
        Next
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
