import { NativeModules, Platform } from 'react-native';

export interface InstalledAppItem {
  appName: string;
  packageName: string;
  icon?: string;
  category: 'Social' | 'Entertainment' | 'Games' | 'Communication' | 'Productivity';
}

/**
 * Checks whether Android Usage Access permission has actually been granted by the user.
 * Returns false on fresh install until user manually toggles it in Android Settings.
 */
export async function checkNativeUsageAccess(): Promise<boolean> {
  if (Platform.OS === 'android' && NativeModules.InstalledApps?.hasUsageAccess) {
    try {
      const allowed = await NativeModules.InstalledApps.hasUsageAccess();
      return Boolean(allowed);
    } catch {
      return false;
    }
  }
  return false;
}

export interface SystemUsageMetrics {
  totalScreenMinutes: number;
  unlocks: number;
  pickups: number;
  appUsage: Record<string, number>;
}

/**
 * Automatically queries Android UsageStatsManager and Keyguard/Screen events
 * Returns real screen minutes, unlocks, pickups, and foreground app breakdown.
 */
export async function fetchSystemUsageMetrics(): Promise<SystemUsageMetrics> {
  if (Platform.OS === 'android' && NativeModules.InstalledApps?.getSystemUsageMetrics) {
    try {
      const res = await NativeModules.InstalledApps.getSystemUsageMetrics();
      if (res) {
        return {
          totalScreenMinutes: Number(res.totalScreenMinutes || 0),
          unlocks: Number(res.unlocks || 0),
          pickups: Number(res.pickups || 0),
          appUsage: res.appUsage || {},
        };
      }
    } catch (e) {
      console.warn('Native getSystemUsageMetrics failed:', e);
    }
  }

  return {
    totalScreenMinutes: 0,
    unlocks: 0,
    pickups: 0,
    appUsage: {},
  };
}

/**
 * Queries ONLY real physical applications installed on the device.
 * Zero fake or mock data.
 */
export async function fetchInstalledApps(): Promise<InstalledAppItem[]> {
  if (Platform.OS === 'android' && NativeModules.InstalledApps) {
    try {
      const apps = await NativeModules.InstalledApps.getInstalledApps();
      if (Array.isArray(apps)) {
        return apps as InstalledAppItem[];
      }
    } catch (e) {
      console.warn('Native getInstalledApps failed:', e);
    }
  }

  // Zero fake data: returns strictly empty array if not running on device
  return [];
}
