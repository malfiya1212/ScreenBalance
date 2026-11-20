import { NativeModules, Platform } from 'react-native';
import { recordDailyAppUsageAsync, getTodayDateKey } from '@/services/sqliteNotificationStorage';

export interface TodayUsageStats {
  totalScreenMinutes: number;
  unlocks: number;
  pickups: number;
  notifications: number;
  appUsage: Record<string, number>;
}

/**
 * Native Android collection connector:
 * Queries UsageStatsManager, ACTION_USER_PRESENT (unlocks), ACTION_SCREEN_ON (pickups),
 * and NotificationListenerService counts, saving directly into SQLite.
 */
export async function getTodayUsageStats(): Promise<TodayUsageStats> {
  if (Platform.OS === 'android' && NativeModules.InstalledApps?.getTodayUsageStats) {
    try {
      const stats = await NativeModules.InstalledApps.getTodayUsageStats();
      if (stats) {
        return {
          totalScreenMinutes: Number(stats.totalScreenMinutes || 0),
          unlocks: Number(stats.unlocks || 0),
          pickups: Number(stats.pickups || 0),
          notifications: Number(stats.notifications || 0),
          appUsage: stats.appUsage || {},
        };
      }
    } catch (e) {
      console.warn('Native getTodayUsageStats failed:', e);
    }
  }

  return {
    totalScreenMinutes: 0,
    unlocks: 0,
    pickups: 0,
    notifications: 0,
    appUsage: {},
  };
}

/**
 * Starts the native persistent Foreground tracking service for ACTION_USER_PRESENT & SCREEN_ON
 */
export async function startNativeTrackingService(): Promise<boolean> {
  if (Platform.OS === 'android' && NativeModules.InstalledApps?.startBackgroundTracking) {
    try {
      return await NativeModules.InstalledApps.startBackgroundTracking();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Syncs the native Android usage metrics into local SQLite tables
 */
export async function syncAndGetDailyUsage(dateKey: string = getTodayDateKey()): Promise<TodayUsageStats> {
  const stats = await getTodayUsageStats();

  try {
    // Record into SQLite daily usage table
    await recordDailyAppUsageAsync({
      appId: 'system_overall',
      appName: 'System Metrics',
      category: 'System',
      minutesDelta: 0,
      pickupsDelta: stats.pickups,
      unlocksDelta: stats.unlocks,
      dateKey,
    });
  } catch {
    // Graceful fallback
  }

  return stats;
}
