import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider, ActivityIndicator, Surface } from 'react-native-paper';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AnswerRewriterProps {
  sessionId: string;
  turnNumber: number;
  originalTranscript: string;
  /** Optional pre-loaded rewrite data */
  rewriteData?: { improved: string; improvements: string[] } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Side-by-side answer rewriter comparison view.
 *
 * Displays the user's original transcript alongside the AI-improved version,
 * with a list of specific improvements highlighted below.
 *
 * Requirements: 5.1, 5.2, 5.3
 */
export default function AnswerRewriter({
  sessionId,
  turnNumber,
  originalTranscript,
  rewriteData: initialRewriteData = null,
}: AnswerRewriterProps) {
  const [rewriteData, setRewriteData] = useState<{
    improved: string;
    improvements: string[];
  } | null>(initialRewriteData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRewrite = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const functions = getFunctions(app);
      const getRewrite = httpsCallable<
        { sessionId: string; turnNumber: number; transcript: string },
        { original: string; improved: string; improvements: string[] }
      >(functions, 'getRewrite');

      const result = await getRewrite({
        sessionId,
        turnNumber,
        transcript: originalTranscript,
      });

      setRewriteData({
        improved: result.data.improved,
        improvements: result.data.improvements,
      });
    } catch (err) {
      setError('Failed to get rewrite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text variant="headlineSmall" style={styles.title}>
        Answer Comparison
      </Text>

      {/* Original Answer Card */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Your Answer
          </Text>
          <Divider style={styles.divider} />
          <Text variant="bodyMedium" style={styles.transcriptText}>
            {originalTranscript}
          </Text>
        </Card.Content>
      </Card>

      {/* Improved Version Card */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Improved Version
          </Text>
          <Divider style={styles.divider} />
          {rewriteData ? (
            <Text variant="bodyMedium" style={styles.improvedText}>
              {rewriteData.improved}
            </Text>
          ) : (
            <Text variant="bodyMedium" style={styles.placeholderText}>
              {isLoading
                ? 'Generating improved version...'
                : 'Tap "Get Rewrite" to see an improved version of your answer.'}
            </Text>
          )}
          {isLoading && (
            <ActivityIndicator
              animating
              size="small"
              style={styles.loader}
            />
          )}
        </Card.Content>
      </Card>

      {/* Improvements List */}
      {rewriteData && rewriteData.improvements.length > 0 && (
        <Card style={styles.improvementsCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Improvements
            </Text>
            <Divider style={styles.divider} />
            {rewriteData.improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementRow}>
                <Surface style={styles.improvementBadge} elevation={0}>
                  <Text variant="labelSmall" style={styles.badgeText}>
                    {index + 1}
                  </Text>
                </Surface>
                <Text variant="bodyMedium" style={styles.improvementText}>
                  {improvement}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Text variant="bodySmall" style={styles.errorText}>
          {error}
        </Text>
      )}

      {/* Get Rewrite Button */}
      {!rewriteData && (
        <Button
          mode="contained"
          onPress={handleGetRewrite}
          loading={isLoading}
          disabled={isLoading}
          style={styles.rewriteButton}
          contentStyle={styles.buttonContent}
          icon="auto-fix"
        >
          Get Rewrite
        </Button>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontWeight: '700',
    color: '#1A1D26',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Cards
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  improvementsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontWeight: '600',
    color: '#1A1D26',
  },
  divider: {
    marginVertical: 12,
  },

  // Transcript text
  transcriptText: {
    color: '#374151',
    lineHeight: 22,
  },
  improvedText: {
    color: '#1B5E20',
    lineHeight: 22,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Loading
  loader: {
    marginTop: 12,
  },

  // Improvements list
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  improvementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  badgeText: {
    color: '#1E88E5',
    fontWeight: '700',
  },
  improvementText: {
    flex: 1,
    color: '#374151',
    lineHeight: 22,
  },

  // Error
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 12,
  },

  // Button
  rewriteButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
