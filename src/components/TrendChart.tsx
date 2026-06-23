import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';

export interface TrendChartProps {
  sessions: { date: string; confidenceScore: number; anxietyReading: number }[];
}

const CHART_PADDING = 32;
const MIN_SESSIONS = 3;

/**
 * Formats a date string (e.g. "2024-01-15") into a short label (e.g. "Jan 15").
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Line chart showing Confidence Score and Anxiety Meter trends over time.
 *
 * Only displays the chart when the user has 3 or more completed sessions.
 * X-axis: session dates, Y-axis: scores (0-100).
 *
 * Requirements: 6.3, 9.4
 */
export default function TrendChart({ sessions }: TrendChartProps) {
  if (sessions.length < MIN_SESSIONS) {
    return (
      <Surface style={styles.surface} elevation={2}>
        <Text variant="labelMedium" style={styles.title}>
          Progress Trends
        </Text>
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Complete 3+ sessions to see your trends!
          </Text>
        </View>
      </Surface>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - CHART_PADDING;

  const labels = sessions.map((s) => formatDateLabel(s.date));
  const confidenceData = sessions.map((s) => s.confidenceScore);
  const anxietyData = sessions.map((s) => s.anxietyReading);

  const data = {
    labels,
    datasets: [
      {
        data: confidenceData,
        color: (_opacity = 1) => '#2196F3', // blue for Confidence
        strokeWidth: 2,
      },
      {
        data: anxietyData,
        color: (_opacity = 1) => '#F44336', // red for Anxiety
        strokeWidth: 2,
      },
    ],
    legend: ['Confidence', 'Anxiety'],
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalCount: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E0E0E0',
    },
  };

  return (
    <Surface style={styles.surface} elevation={2}>
      <Text variant="labelMedium" style={styles.title}>
        Progress Trends
      </Text>
      <LineChart
        data={data}
        width={chartWidth}
        height={220}
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero
        segments={4}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginBottom: 12,
    color: '#6B7280',
  },
  chart: {
    borderRadius: 8,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
