import {
  getTodayDateKey,
  getDailyUsageForDateAsync,
  DailyUsageRecord,
} from './sqliteNotificationStorage';
import { getTodayUsageStats, TodayUsageStats } from './usageSyncService';

export interface FocusChallengeResult {
  dateKey: string;
  points: number;
  totalRules: number;
  completedRules: number;
  details: {
    ruleName: string;
    usedMinutes: number;
    limitMinutes: number;
    achieved: boolean;
  }[];
}

interface AppRuleInput {
  id: string;
  name: string;
  limit: number;
  used?: number;
  category?: string;
}

// In-memory cache for fast synchronous reads when desired
const localPointsCache: Record<string, { points: number; completedRules: number; totalRules: number }> = {};
let isTrackingActiveState = true;

/**
 * Calculates today's focus points completely on-device without any server.
 * Rule: +1 point per active app limit that stays within its daily limit.
 */
export async function calculateTodayFocusPoints(
  appLimits: AppRuleInput[],
  dateKey: string = getTodayDateKey()
): Promise<FocusChallengeResult> {
  const details: FocusChallengeResult['details'] = [];
  let completedRules = 0;

  try {
    // 1. Fetch real SQLite daily usage logs for today
    const sqliteLogs: DailyUsageRecord[] = await getDailyUsageForDateAsync(dateKey);
    const sqliteUsageMap: Record<string, number> = {};
    for (const log of sqliteLogs) {
      const key = log.app_name.toLowerCase();
      sqliteUsageMap[key] = Math.max(sqliteUsageMap[key] || 0, log.minutes_used || 0);
    }

    // 2. Fetch live native Android UsageStatsManager stats
    let nativeStats: TodayUsageStats | null = null;
    try {
      nativeStats = await getTodayUsageStats();
    } catch {
      nativeStats = null;
    }

    // 3. Evaluate each rule
    for (const app of appLimits) {
      if (!app.limit || app.limit <= 0) continue;

      const lowerName = app.name.toLowerCase();
      const sqliteUsed = sqliteUsageMap[lowerName] || 0;
      const nativeUsed = nativeStats?.appUsage?.[lowerName] || 0;
      const appStateUsed = app.used || 0;

      // The true used minutes is the maximum of reliable local sources
      const actualUsed = Math.max(appStateUsed, sqliteUsed, nativeUsed);
      const achieved = actualUsed <= app.limit;

      if (achieved) {
        completedRules += 1;
      }

      details.push({
        ruleName: app.name,
        usedMinutes: actualUsed,
        limitMinutes: app.limit,
        achieved,
      });
    }

    // +1 point per real completed rule
    const points = completedRules;

    // Cache locally in-memory
    localPointsCache[dateKey] = {
      points,
      completedRules,
      totalRules: appLimits.length,
    };

    return {
      dateKey,
      points,
      totalRules: appLimits.length,
      completedRules,
      details,
    };
  } catch {
    return {
      dateKey,
      points: 0,
      totalRules: appLimits.length,
      completedRules: 0,
      details: [],
    };
  }
}

/**
 * Checks or marks auto-tracking as active in local state.
 */
export async function getAutoTrackingStatus(): Promise<boolean> {
  return isTrackingActiveState;
}

export async function setAutoTrackingStatus(active: boolean): Promise<void> {
  isTrackingActiveState = active;
}
