/**
 * PrepMate AI — Industry Selection Screen (Onboarding Step 1)
 *
 * Allows user to select their target industry: Technology, Finance, or Consulting.
 * Navigates to ExperienceScreen on completion.
 *
 * Validates: Requirements 8.1, 8.2
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, RadioButton, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { Industry } from '../../types';

type IndustryScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Industry'>;

const INDUSTRY_OPTIONS: { value: Industry; label: string }[] = [
  { value: Industry.Technology, label: 'Technology' },
  { value: Industry.Finance, label: 'Finance' },
  { value: Industry.Consulting, label: 'Consulting' },
];

export default function IndustryScreen() {
  const navigation = useNavigation<IndustryScreenNavigationProp>();
  const [selected, setSelected] = useState<Industry | ''>('');

  const handleNext = () => {
    if (selected) {
      navigation.navigate('Experience', { industry: selected });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          What industry are you targeting?
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          We'll tailor your interview questions accordingly.
        </Text>

        <RadioButton.Group
          onValueChange={(value) => setSelected(value as Industry)}
          value={selected}
        >
          {INDUSTRY_OPTIONS.map((option) => (
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
