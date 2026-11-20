import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  initSqliteAsync,
  recordSentNotificationAsync,
  getTodayDateKey,
} from './sqliteNotificationStorage';

export const SCREENBALANCE_CHANNEL_ID = 'screenbalance-alerts';

// Ensure foreground notifications display banner, list, sound, and badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface ScreenBalanceNotificationData {
  appName?: string;
  reason?: 'limit_reached' | 'schedule_block' | 'focus_session' | 'general';
  action?: 'open_restriction' | 'open_home';
  timestamp?: number;
}

export interface StoredNotificationItem {
  id: string;
  title: string;
  body: string;
  data?: ScreenBalanceNotificationData;
  seen: boolean;
  createdAt: number;
}

// In-memory record of seen/unseen notifications for quick UI checks
let ownNotificationsStore: StoredNotificationItem[] = [];

/**
 * Initializes notification channels and requests user permissions for Android 13+.
 */
export async function initOwnNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(SCREENBALANCE_CHANNEL_ID, {
        name: 'ScreenBalance Alerts',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[localNotificationService] initOwnNotifications error:', error);
    return false;
  }
}

/**
 * Sends a local notification into the Android status bar.
 * Appears even when ScreenBalance is closed or in background.
 */
export async function sendScreenBalanceNotification(
  title: string,
  body: string,
  data: ScreenBalanceNotificationData = { reason: 'limit_reached', action: 'open_restriction' }
): Promise<string | null> {
  try {
    await initOwnNotifications();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          ...data,
          timestamp: Date.now(),
        },
      },
      trigger: {
        channelId: SCREENBALANCE_CHANNEL_ID,
      },
    });

    const newItem: StoredNotificationItem = {
      id: notificationId,
      title,
      body,
      data,
      seen: false,
      createdAt: Date.now(),
    };
    ownNotificationsStore.unshift(newItem);

    // Also persist into SQLite notification storage for unified history
    try {
      await initSqliteAsync();
      await recordSentNotificationAsync({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        app_id: data.appName?.toLowerCase() || 'screenbalance',
        app_name: data.appName || 'ScreenBalance',
        threshold: 0,
        date_key: getTodayDateKey(),
        remaining_minutes: 0,
        limit_minutes: 0,
        title,
        message: body,
        severity: 'critical',
        sent_at: Date.now(),
      });
    } catch {}

    return notificationId;
  } catch (error) {
    console.warn('[localNotificationService] sendScreenBalanceNotification error:', error);
    return null;
  }
}

/**
 * Marks all or specific local notifications as seen when user taps them.
 */
export function markOwnNotificationsSeen(notificationId?: string): void {
  if (notificationId) {
    ownNotificationsStore = ownNotificationsStore.map((item) =>
      item.id === notificationId ? { ...item, seen: true } : item
    );
  } else {
    ownNotificationsStore = ownNotificationsStore.map((item) => ({ ...item, seen: true }));
  }
}

/**
 * Gets all local notifications and their seen status.
 */
export function getOwnNotifications(): StoredNotificationItem[] {
  return [...ownNotificationsStore];
}

/**
 * Gets the count of unseen notifications.
 */
export function getUnseenNotificationCount(): number {
  return ownNotificationsStore.filter((n) => !n.seen).length;
}
