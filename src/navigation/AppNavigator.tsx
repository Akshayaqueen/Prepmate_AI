import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../store/useAppStore';
import { useThemeMode } from '../theme/ThemeContext';
import { palette } from '../theme/theme';
import LoginScreen from '../screens/LoginScreen';
import IndustryScreen from '../screens/onboarding/IndustryScreen';
import ExperienceScreen from '../screens/onboarding/ExperienceScreen';
import TimelineScreen from '../screens/onboarding/TimelineScreen';
import HomeScreen from '../screens/HomeScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ResumeScreen from '../screens/ResumeScreen';
import SessionScreen from '../screens/SessionScreen';
import ResultsScreen from '../screens/ResultsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import RoadmapScreen from '../screens/RoadmapScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import QuestionLibraryScreen from '../screens/QuestionLibraryScreen';
import CheatsheetsScreen from '../screens/CheatsheetsScreen';
import CodingPracticeScreen from '../screens/CodingPracticeScreen';
import { Industry, ExperienceLevel, ConfidenceCategory, Persona, Difficulty, QuestionType } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Industry: undefined;
  Experience: { industry: Industry };
  Timeline: { industry: Industry; experienceLevel: ExperienceLevel };
};

/** Route params matching the POST /endSession response format */
export type SessionResultsParams = {
  confidenceScore: number;
  confidenceCategory: ConfidenceCategory;
  avgStarScore: number;
  anxietyReading: number;
  fillerCount: number;
  sessionDuration: number; // seconds
  topSuggestions: string[];
  xpAwarded: number;
};

/** Route params for starting an active session */
export type SessionParams = {
  sessionId: string;
  question: string;
  questionType: QuestionType;
  persona: Persona;
  difficulty: Difficulty;
};

export type MainTabsParamList = {
  Home: undefined;
  Practice: undefined;
  Resume: undefined;
  History: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Session: { session: SessionParams } | undefined;
  Results: { results: SessionResultsParams } | undefined;
  Achievements: undefined;
  Roadmap: undefined;
  Analytics: undefined;
  QuestionLibrary: undefined;
  Cheatsheets: undefined;
  CodingPractice: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Industry" component={IndustryScreen} />
      <AuthStack.Screen name="Experience" component={ExperienceScreen} />
      <AuthStack.Screen name="Timeline" component={TimelineScreen} />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabsParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Home: 'home-variant',
  Practice: 'microphone',
  Resume: 'file-document-edit',
  History: 'chart-timeline-variant',
  Settings: 'account-circle',
};

const TAB_LABELS: Record<keyof MainTabsParamList, string> = {
  Home: 'Home',
  Practice: 'Practice',
  Resume: 'Resume',
  History: 'Progress',
  Settings: 'Profile',
};

function MainTabs() {
  const { isDark } = useThemeMode();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mist,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1F38' : palette.white,
          borderTopColor: isDark ? '#2A2C48' : palette.cloud,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabel: TAB_LABELS[route.name],
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Practice" component={PracticeScreen} />
      <Tabs.Screen name="Resume" component={ResumeScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="Session" component={SessionScreen} />
      <MainStack.Screen name="Results" component={ResultsScreen} />
      <MainStack.Screen name="Achievements" component={AchievementsScreen} />
      <MainStack.Screen name="Roadmap" component={RoadmapScreen} />
      <MainStack.Screen name="Analytics" component={AnalyticsScreen} />
      <MainStack.Screen name="QuestionLibrary" component={QuestionLibraryScreen} />
      <MainStack.Screen name="Cheatsheets" component={CheatsheetsScreen} />
      <MainStack.Screen name="CodingPractice" component={CodingPracticeScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { isDark } = useThemeMode();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
