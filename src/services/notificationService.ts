import { Platform, Vibration } from 'react-native';

export type NotificationSeverity = 'info' | 'warning' | 'urgent' | 'critical';

export interface DynamicNotification {
  id: string;
  appName: string;
  remainingMinutes: number;
  totalLimitMinutes?: number;
  threshold: number;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
  read?: boolean;
}

export interface NotificationThresholdOption {
  minutes: number;
  label: string;
  enabled: boolean;
}

export const DEFAULT_THRESHOLDS = [15, 10, 5, 1, 0];

/**
 * Dynamically generates personalized notification title, message body, and severity
 * based on the application name and remaining screen time allowance.
 */
export function generateDynamicNotificationMessage(
  appName: string,
  remainingMinutes: number,
  totalLimitMinutes?: number
): { title: string; message: string; severity: NotificationSeverity; threshold: number } {
  const cleanAppName = appName.trim() || 'Application';
  const mins = Math.max(0, Math.floor(remainingMinutes));

  if (mins <= 0) {
    return {
      threshold: 0,
      severity: 'critical',
      title: `🚨 Daily Limit Reached: ${cleanAppName}`,
      message: totalLimitMinutes
        ? `You have reached your ${totalLimitMinutes}m daily limit for ${cleanAppName}. Time is up for today — step away and recharge your focus!`
        : `Your allowance for ${cleanAppName} is fully used. Time is up for today — step away and recharge!`,
    };
  }

  if (mins === 1) {
    return {
      threshold: 1,
      severity: 'urgent',
      title: `⏳ 1 Minute Left: ${cleanAppName}`,
      message: `Only 1 minute remaining on ${cleanAppName}! Finish up what you are doing and prepare to close the app.`,
    };
  }

  if (mins <= 5) {
    return {
      threshold: 5,
      severity: 'urgent',
      title: `⚠️ 5 Minutes Remaining: ${cleanAppName}`,
      message: `You have 5 minutes of screen time left for ${cleanAppName}. Start winding down your current session to maintain your streak.`,
    };
  }

  if (mins <= 10) {
    return {
      threshold: 10,
      severity: 'warning',
      title: `⏱️ 10 Minutes Left: ${cleanAppName}`,
      message: `10 minutes left for ${cleanAppName}. Keep your screen balance goals in mind and plan your stopping point!`,
    };
  }

  if (mins <= 15) {
    return {
      threshold: 15,
      severity: 'warning',
      title: `Approaching Limit: ${cleanAppName}`,
      message: `15 minutes of allowance remaining on ${cleanAppName}. You are nearing today's limit.`,
    };
  }

  if (mins <= 30) {
    return {
      threshold: 30,
      severity: 'info',
      title: `Screen Check: ${cleanAppName}`,
      message: `30 minutes remaining on ${cleanAppName}. Great pacing so far today — stay mindful!`,
    };
  }

  return {
    threshold: mins,
    severity: 'info',
    title: `Healthy Balance: ${cleanAppName}`,
    message: `You have ${mins}m remaining for ${cleanAppName}. Enjoy your mindful usage!`,
  };
}

/**
 * Dispatches physical hardware vibration patterns based on alert urgency.
 */
export function triggerHapticFeedback(severity: NotificationSeverity) {
  try {
    switch (severity) {
      case 'critical':
        Vibration.vibrate([0, 300, 150, 300, 150, 450]);
        break;
      case 'urgent':
        Vibration.vibrate([0, 200, 120, 200]);
        break;
      case 'warning':
        Vibration.vibrate([0, 160, 100, 160]);
        break;
      case 'info':
      default:
        Vibration.vibrate(80);
        break;
    }
  } catch {
    // Vibration not supported or permission denied
  }
}

/**
 * Dispatches a native browser notification when running in web environment.
 */
export function triggerBrowserNotification(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    } catch {
      // Safe fail
    }
  }
}

/**
 * Evaluates a list of app limits against active notification thresholds.
 * Returns any newly triggered dynamic notifications and the updated set of notified keys.
 */
export function evaluateAppLimitsForNotifications(
  limits: { id: string; name: string; used: number; limit: number }[],
  alreadyNotifiedKeys: Set<string>,
  activeThresholds: number[] = DEFAULT_THRESHOLDS
): {
  newNotifications: DynamicNotification[];
  updatedNotifiedKeys: Set<string>;
} {
  const newNotifications: DynamicNotification[] = [];
  const updatedNotifiedKeys = new Set(alreadyNotifiedKeys);

  for (const app of limits) {
    if (app.limit <= 0) continue;
    const remaining = Math.max(0, app.limit - app.used);

    for (const threshold of activeThresholds) {
      if (remaining <= threshold) {
        const key = `${app.id}-threshold-${threshold}`;
        if (!updatedNotifiedKeys.has(key)) {
          updatedNotifiedKeys.add(key);
          const generated = generateDynamicNotificationMessage(
            app.name,
            remaining,
            app.limit
          );

          newNotifications.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            appName: app.name,
            remainingMinutes: remaining,
            totalLimitMinutes: app.limit,
            threshold,
            title: generated.title,
            message: generated.message,
            severity: generated.severity,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  return { newNotifications, updatedNotifiedKeys };
}
