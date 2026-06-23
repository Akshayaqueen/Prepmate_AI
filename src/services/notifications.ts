/**
 * Daily Practice Reminder Notifications
 *
 * Uses expo-notifications to schedule local daily reminders at the user's
 * preferred time. For a college project, local notifications (scheduled
 * on-device) are more practical than server-sent FCM.
 *
 * Also registers the Expo push token in the user's Firestore document
 * for potential future server-sent notifications.
 *
 * Requirements: 7.6
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/** Unique identifier for the daily reminder notification */
const DAILY_REMINDER_ID = 'daily-practice-reminder';

/**
 * Configure notification handler for foreground notifications.
 * Called once at app startup.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Requests notification permissions from the user.
 * Should be called on first launch or when user enables reminders.
 *
 * @returns true if permissions were granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Registers for push notifications and stores the Expo push token
 * in the user's Firestore document.
 *
 * @param userId - The authenticated user's ID
 * @returns The Expo push token string, or null if registration fails
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();

  if (!hasPermission) {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store the push token in the user's Firestore document
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      expoPushToken: token,
      updatedAt: new Date(),
    });

    return token;
  } catch (error) {
    console.warn('Failed to register for push notifications:', error);
    return null;
  }
}

/**
 * Schedules a daily local notification at the user's preferred time.
 * Cancels any existing daily reminder before scheduling the new one.
 *
 * @param time - Time string in "HH:mm" format (e.g., "09:00")
 */
export async function scheduleDailyReminder(time: string): Promise<void> {
  // Cancel existing reminder first to avoid duplicates
  await cancelDailyReminder();

  const [hoursStr, minutesStr] = time.split(':');
  const hour = parseInt(hoursStr, 10);
  const minute = parseInt(minutesStr, 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    console.warn('Invalid time format for daily reminder:', time);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'PrepMate AI',
      body: 'Time to practice! Keep your streak going 🔥',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancels the scheduled daily reminder notification.
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
}
