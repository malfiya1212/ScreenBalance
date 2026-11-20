import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Vibration } from 'react-native';
import {
  DEFAULT_THRESHOLDS,
  DynamicNotification,
  generateDynamicNotificationMessage,
  triggerBrowserNotification,
  triggerHapticFeedback,
} from '@/services/notificationService';
import {
  clearAllPersistedAppDataAsync,
  clearSentNotificationsAsync,
  deletePersistedAppLimitAsync,
  deletePersistedInAppShieldAsync,
  deletePersistedScheduleAsync,
  deleteSentNotificationByIdAsync,
  getDailyUsageForDateAsync,
  getPersistedAppLimitsAsync,
  getPersistedInAppShieldsAsync,
  getPersistedSchedulesAsync,
  getPersistedUsersAsync,
  getSentNotificationsAsync,
  getTodayDateKey,
  hasNotificationBeenSentAsync,
  initSqliteAsync,
  recordDailyAppUsageAsync,
  recordSentNotificationAsync,
  resetDailyUsageForDateAsync,
  savePersistedAppLimitAsync,
  savePersistedInAppShieldAsync,
  savePersistedScheduleAsync,
  savePersistedUserAsync,
  ScheduleRecord,
  SentNotificationRecord,
  togglePersistedInAppShieldAsync,
  togglePersistedScheduleAsync,
  UserAccountRecord,
} from '@/services/sqliteNotificationStorage';

export type { DynamicNotification, ScheduleRecord, SentNotificationRecord, UserAccountRecord };

export interface ScheduleItem {
  id: string;
  name: string;
  type: 'study' | 'sleep' | 'focus';
  startTime: string;
  endTime: string;
  daysActive: string[];
  isEnabled: boolean;
  blockedApps: string[];
}

export interface AppLimit {
  id: string;
  name: string;
  used: number; // in minutes
  limit: number; // in minutes
  category?: string;
}

export interface CombinedLimit {
  id: string;
  name: string;
  appNames: string[];
  limit: number; // in minutes
  used: number; // in minutes
}

export interface InAppBlockRule {
  id: string;
  appName: string;
  packageName?: string;
  appIcon?: string;
  featureName: string;
  description: string;
  isEnabled: boolean;
  blocksPrevented?: number;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  avgDailyMinutes: number; // 7-day average
  streakDays: number;
}

export interface FocusSession {
  isActive: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  blockedApps: string[];
}

export interface AppPermissions {
  usageAccess: boolean;
  notifications: boolean;
  screenOverlay: boolean;
  accessibilityService: boolean;
}

export interface HourlyUsagePoint {
  timeLabel: string;
  minutes: number;
}

export interface DeviceApp {
  id: string;
  name: string;
  category: string;
  icon: string;
  isDetected?: boolean;
}

export interface RegisteredUser {
  name: string;
  email: string;
  password: string;
  createdAt: number;
}

interface AppContextType {
  user: { name: string; email: string } | null;
  setUser: (user: { name: string; email: string } | null) => void;

  // Frontend-only Mock Authentication & Accounts
  registeredUsers: RegisteredUser[];
  registerAccount: (account: {
    name: string;
    email: string;
    password: string;
  }) => { success: boolean; error?: string };
  loginAccount: (credentials: {
    email: string;
    password: string;
  }) => {
    success: boolean;
    error?: string;
    user?: { name: string; email: string };
  };
  doesEmailExist: (email: string) => boolean;
  resetPassword: (email: string) => { success: boolean; error?: string };

  // Device Applications (Selected from Device, Zero Hardcoding)
  deviceApps: DeviceApp[];
  addDeviceApp: (name: string, category?: string, icon?: string) => void;
  removeDeviceApp: (id: string) => void;
  setDeviceApps: React.Dispatch<React.SetStateAction<DeviceApp[]>>;

  // Single App Limits
  appLimits: AppLimit[];
  addAppLimit: (name: string, limitMinutes: number, category?: string) => void;
  deleteAppLimit: (id: string) => void;
  logAppUsage: (id: string, minutes: number) => void;
  resetAllUsage: () => void;
  clearAllData: () => void;

  // Combined Limits (Step 3)
  combinedLimits: CombinedLimit[];
  addCombinedLimit: (name: string, appNames: string[], limitMinutes: number) => void;
  deleteCombinedLimit: (id: string) => void;
  logCombinedUsage: (id: string, minutes: number) => void;

  // In-App Granular Blocking (Step 2)
  inAppRules: InAppBlockRule[];
  addInAppRule: (rule: {
    appName: string;
    packageName?: string;
    appIcon?: string;
    featureName: string;
    description: string;
  }) => void;
  deleteInAppRule: (id: string) => void;
  toggleInAppRule: (id: string) => void;

  // Study and Sleep Schedules (Step 8: 100% On-Device SQLite Persistent)
  schedules: ScheduleItem[];
  addSchedule: (schedule: Omit<ScheduleItem, 'id' | 'isEnabled'>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  toggleSchedule: (id: string) => Promise<void>;

  // Friends & Social Accountability (Step 5)
  friends: Friend[];
  addFriend: (name: string, avgMinutes?: number, streak?: number) => void;
  removeFriend: (id: string) => void;

  // Local Notifications & Alarms (100% On-Device, No Cloud / No Backend)
  localNotificationsEnabled: boolean;
  toggleLocalNotifications: () => void;
  triggerLocalNotification: (title: string, message: string) => void;

  // Automatic Dynamic Notification Service (SQLite-backed duplicate prevention)
  notificationHistory: DynamicNotification[];
  activeToast: DynamicNotification | null;
  dismissToast: () => void;
  activeThresholds: number[];
  toggleThreshold: (threshold: number) => void;
  triggerDynamicNotification: (
    appName: string,
    remainingMinutes: number,
    totalLimitMinutes?: number,
    force?: boolean
  ) => Promise<DynamicNotification | null>;
  checkAndNotifyAppLimitAsync: (app: {
    id: string;
    name: string;
    limit: number;
    used: number;
  }) => Promise<DynamicNotification | null>;
  clearNotificationHistory: () => Promise<void>;
  deleteNotificationHistoryItem: (id: string) => Promise<void>;

  // Hourly Line Graph Data (Step 4)
  hourlyUsage: HourlyUsagePoint[];
  logHourlyUsage: (timeLabel: string, minutes: number) => void;

  // Focus Session
  focusSession: FocusSession;
  startFocusSession: (minutes: number) => void;
  cancelFocusSession: () => void;

  // Permissions (Step 1)
  permissions: AppPermissions;
  setPermissions: React.Dispatch<React.SetStateAction<AppPermissions>>;
  togglePermission: (key: keyof AppPermissions) => void;
}

const DEFAULT_IN_APP_RULES: InAppBlockRule[] = [];

// Zero hardcoded accounts - all accounts are created by real user registration
const loadInitialUsers = (): RegisteredUser[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('sb_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any previous dummy/demo accounts
          return parsed.filter(
            (u) =>
              u &&
              u.email &&
              u.email !== 'user@screenbalance.com' &&
              u.email !== 'alex@example.com' &&
              u.email !== 'google.user@gmail.com'
          );
        }
      }
    } catch {
      // Storage unavailable or invalid
    }
  }
  return [];
};

const loadInitialDeviceApps = (): DeviceApp[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('sb_device_apps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Storage unavailable
    }
  }
  return [];
};

const loadInitialNotificationHistory = (): DynamicNotification[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('sb_notification_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Storage unavailable
    }
  }
  return [];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(loadInitialUsers);

  // Sync registered users to localStorage when in web/browser environment
  const saveUsers = (updated: RegisteredUser[]) => {
    setRegisteredUsers(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('sb_registered_users', JSON.stringify(updated));
      } catch {
        // Storage failure ignored safely
      }
    }
  };

  const doesEmailExist = (email: string): boolean => {
    const clean = email.trim().toLowerCase();
    return registeredUsers.some((u) => u.email.toLowerCase() === clean);
  };

  /**
   * Registers a new user into frontend storage.
   * NOTE: Does NOT log the user in directly! User must sign in with email & password.
   */
  const registerAccount = (account: {
    name: string;
    email: string;
    password: string;
  }): { success: boolean; error?: string } => {
    const cleanEmail = account.email.trim().toLowerCase();
    const cleanName = account.name.trim();
    const cleanPassword = account.password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (doesEmailExist(cleanEmail)) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.',
      };
    }

    const newUser: RegisteredUser = {
      name: cleanName || 'User',
      email: cleanEmail,
      password: cleanPassword,
      createdAt: Date.now(),
    };

    const updated = [...registeredUsers, newUser];
    saveUsers(updated);

    // Persist to SQLite user_accounts database
    savePersistedUserAsync({
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      created_at: newUser.createdAt,
    });

    // Frontend-only: Account is created, but NOT authenticated yet.
    return { success: true };
  };

  /**
   * Validates email & password against registered users in frontend storage.
   */
  const loginAccount = (credentials: {
    email: string;
    password: string;
  }): {
    success: boolean;
    error?: string;
    user?: { name: string; email: string };
  } => {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const cleanPassword = credentials.password.trim();

    const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        success: false,
        error: 'No account found with this email. Please create an account first.',
      };
    }

    if (found.password !== cleanPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.',
      };
    }

    const authedUser = { name: found.name, email: found.email };
    setUser(authedUser);
    return { success: true, user: authedUser };
  };

  /**
   * Checks email for password reset verification
   */
  const resetPassword = (email: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!doesEmailExist(cleanEmail)) {
      return {
        success: false,
        error: 'No account registered with this email address.',
      };
    }
    return { success: true };
  };

  // Device Applications (Selected from Device, Zero Hardcoding)
  const [deviceApps, setDeviceApps] = useState<DeviceApp[]>(loadInitialDeviceApps);

  const addDeviceApp = (name: string, category = 'Social', icon = '') => {
    const formatted = name.trim();
    if (!formatted) return;
    setDeviceApps((prev) => {
      if (prev.some((a) => a.name.toLowerCase() === formatted.toLowerCase())) {
        return prev;
      }
      const updated = [
        ...prev,
        {
          id: Date.now().toString(),
          name: formatted,
          category,
          icon,
          isDetected: true,
        },
      ];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('sb_device_apps', JSON.stringify(updated));
        } catch {
          // Safe fail
        }
      }
      return updated;
    });
  };

  const removeDeviceApp = (id: string) => {
    setDeviceApps((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('sb_device_apps', JSON.stringify(updated));
        } catch {
          // Safe fail
        }
      }
      return updated;
    });
  };

  // Individual App Limits (starts empty)
  const [appLimits, setAppLimits] = useState<AppLimit[]>([]);

  // Combined Limits (Step 3: starts empty)
  const [combinedLimits, setCombinedLimits] = useState<CombinedLimit[]>([]);

  // In-App Granular Blocking (Step 2: restored with clean non-image vector shields)
  const [inAppRules, setInAppRules] = useState<InAppBlockRule[]>(DEFAULT_IN_APP_RULES);

  // Study & Sleep Schedules (Step 8)
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  // Friends & Social Accountability (Step 5: starts empty)
  const [friends, setFriends] = useState<Friend[]>([]);

  // Hourly Analytics Data (Step 4: starts empty)
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsagePoint[]>([]);

  // Local Notifications & Alarms (100% On-Device, No Backend / No Cloud)
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(true);
  const [notificationHistory, setNotificationHistory] = useState<DynamicNotification[]>(
    loadInitialNotificationHistory
  );
  const [activeToast, setActiveToast] = useState<DynamicNotification | null>(null);
  const [activeThresholds, setActiveThresholds] = useState<number[]>(DEFAULT_THRESHOLDS);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize SQLite database and hydrate all persisted relational tables
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await initSqliteAsync();
        const [records, persistedLimits, todayUsage, persistedShields, persistedSchedules, persistedUsers] = await Promise.all([
          getSentNotificationsAsync(),
          getPersistedAppLimitsAsync(),
          getDailyUsageForDateAsync(getTodayDateKey()),
          getPersistedInAppShieldsAsync(),
          getPersistedSchedulesAsync(),
          getPersistedUsersAsync(),
        ]);

        if (!isMounted) return;

        if (persistedUsers && persistedUsers.length > 0) {
          setRegisteredUsers((prev) => {
            const combined = [...prev];
            for (const pu of persistedUsers) {
              if (!combined.some((u) => u.email.toLowerCase() === pu.email.toLowerCase())) {
                combined.push({
                  name: pu.name,
                  email: pu.email.toLowerCase(),
                  password: pu.password,
                  createdAt: pu.created_at,
                });
              }
            }
            return combined;
          });
        }

        if (records && records.length > 0) {
          setNotificationHistory(
            records.map((r) => ({
              id: r.id,
              appName: r.app_name,
              remainingMinutes: r.remaining_minutes,
              totalLimitMinutes: r.limit_minutes,
              threshold: r.threshold,
              title: r.title,
              message: r.message,
              severity: r.severity as any,
              timestamp: r.sent_at,
            }))
          );
        }

        if (persistedLimits && persistedLimits.length > 0) {
          // De-duplicate persisted limits by app name/id so identical keys never clash
          const uniqueLimitsMap = new Map<string, typeof persistedLimits[0]>();
          for (const l of persistedLimits) {
            uniqueLimitsMap.set(l.name.toLowerCase(), l);
          }
          const uniqueLimits = Array.from(uniqueLimitsMap.values());

          setAppLimits(
            uniqueLimits.map((l) => {
              const matched = todayUsage?.find(
                (u) => u.app_id === l.id || u.app_name.toLowerCase() === l.name.toLowerCase()
              );
              return {
                id: l.id,
                name: l.name,
                category: l.category,
                limit: l.limit_minutes,
                used: matched ? matched.minutes_used : 0,
              };
            })
          );
        }

        if (persistedShields && persistedShields.length > 0) {
          setInAppRules(
            persistedShields.map((s) => ({
              id: s.id,
              appName: s.app_name,
              packageName: s.package_name,
              appIcon: '🛡️',
              featureName: s.feature_name,
              description: `Granular shield for ${s.feature_name} inside ${s.app_name}`,
              isEnabled: s.is_enabled,
              blocksPrevented: s.blocks_prevented || 0,
            }))
          );
        }

        if (persistedSchedules && persistedSchedules.length > 0) {
          setSchedules(
            persistedSchedules.map((sc) => ({
              id: sc.id,
              name: sc.name,
              type: sc.type,
              startTime: sc.start_time,
              endTime: sc.end_time,
              daysActive: (() => {
                try {
                  return JSON.parse(sc.days_active);
                } catch {
                  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                }
              })(),
              isEnabled: sc.is_enabled,
              blockedApps: (() => {
                try {
                  return JSON.parse(sc.blocked_apps);
                } catch {
                  return [];
                }
              })(),
            }))
          );
        }
      } catch {
        // Safe fail
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLocalNotifications = () => {
    setLocalNotificationsEnabled((prev) => !prev);
  };

  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const showNotificationToast = useCallback((notif: DynamicNotification) => {
    setActiveToast(notif);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
  }, []);

  const toggleThreshold = (threshold: number) => {
    setActiveThresholds((prev) => {
      if (prev.includes(threshold)) {
        return prev.filter((t) => t !== threshold);
      } else {
        return [...prev, threshold].sort((a, b) => b - a);
      }
    });
  };

  /**
   * Connects notifications to screen-time limits:
   * Evaluates an app's remaining screen time against threshold milestones,
   * querying SQLite to prevent sending duplicate notifications for the same
   * app and threshold milestone on the same day.
   */
  const checkAndNotifyAppLimitAsync = useCallback(
    async (
      app: { id: string; name: string; limit: number; used: number }
    ): Promise<DynamicNotification | null> => {
      if (!localNotificationsEnabled || app.limit <= 0) return null;

      const remaining = Math.max(0, app.limit - app.used);
      const dateKey = getTodayDateKey();

      for (const threshold of activeThresholds) {
        if (remaining <= threshold) {
          // 1. Query SQLite: has this notification already been sent today?
          const alreadySent = await hasNotificationBeenSentAsync(
            app.id,
            threshold,
            dateKey
          );
          if (alreadySent) {
            // SQLite prevents duplicate!
            continue;
          }

          // 2. Generate dynamic message based on app name and remaining time
          const generated = generateDynamicNotificationMessage(
            app.name,
            remaining,
            app.limit
          );

          const notifId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const notif: DynamicNotification = {
            id: notifId,
            appName: app.name,
            remainingMinutes: remaining,
            totalLimitMinutes: app.limit,
            threshold,
            title: generated.title,
            message: generated.message,
            severity: generated.severity,
            timestamp: Date.now(),
          };

          // 3. Store in SQLite to guarantee duplicate prevention
          const inserted = await recordSentNotificationAsync({
            id: notifId,
            app_id: app.id,
            app_name: app.name,
            threshold,
            date_key: dateKey,
            remaining_minutes: remaining,
            limit_minutes: app.limit,
            title: generated.title,
            message: generated.message,
            severity: generated.severity,
            sent_at: Date.now(),
          });

          if (!inserted) {
            // Concurrent duplicate blocked by SQLite UNIQUE constraint
            continue;
          }

          // 4. Dispatch alert (toast, haptic, browser)
          triggerHapticFeedback(generated.severity);
          triggerBrowserNotification(generated.title, generated.message);
          showNotificationToast(notif);

          // 5. Update in-memory reactive list
          setNotificationHistory((prev) => [notif, ...prev.slice(0, 49)]);
          return notif;
        }
      }

      return null;
    },
    [activeThresholds, localNotificationsEnabled, showNotificationToast]
  );

  const triggerDynamicNotification = useCallback(
    async (
      appName: string,
      remainingMinutes: number,
      totalLimitMinutes?: number,
      force = false
    ): Promise<DynamicNotification | null> => {
      const cleanName = appName.trim() || 'Application';
      const dateKey = getTodayDateKey();
      const generated = generateDynamicNotificationMessage(
        cleanName,
        remainingMinutes,
        totalLimitMinutes
      );

      // Check SQLite duplicate unless force is explicitly set
      if (!force) {
        const alreadySent = await hasNotificationBeenSentAsync(
          cleanName,
          generated.threshold,
          dateKey
        );
        if (alreadySent) {
          Alert.alert(
            'Duplicate Prevented (SQLite)',
            `A ${generated.threshold}m notification for ${cleanName} has already been recorded in SQLite today.`
          );
          return null;
        }
      }

      const notifId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const notif: DynamicNotification = {
        id: notifId,
        appName: cleanName,
        remainingMinutes: Math.max(0, Math.floor(remainingMinutes)),
        totalLimitMinutes,
        threshold: generated.threshold,
        title: generated.title,
        message: generated.message,
        severity: generated.severity,
        timestamp: Date.now(),
      };

      await recordSentNotificationAsync({
        id: notifId,
        app_id: cleanName,
        app_name: cleanName,
        threshold: generated.threshold,
        date_key: dateKey,
        remaining_minutes: Math.max(0, Math.floor(remainingMinutes)),
        limit_minutes: totalLimitMinutes || 0,
        title: generated.title,
        message: generated.message,
        severity: generated.severity,
        sent_at: Date.now(),
      });

      if (localNotificationsEnabled) {
        triggerHapticFeedback(generated.severity);
        triggerBrowserNotification(generated.title, generated.message);
        showNotificationToast(notif);
      }

      setNotificationHistory((prev) => [notif, ...prev.slice(0, 49)]);
      return notif;
    },
    [localNotificationsEnabled, showNotificationToast]
  );

  const clearNotificationHistory = async () => {
    setNotificationHistory([]);
    await clearSentNotificationsAsync();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('sb_notification_history');
      } catch {}
    }
  };

  const deleteNotificationHistoryItem = async (id: string) => {
    setNotificationHistory((prev) => prev.filter((item) => item.id !== id));
    await deleteSentNotificationByIdAsync(id);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'sb_notification_history',
          JSON.stringify(notificationHistory.filter((item) => item.id !== id))
        );
      } catch {}
    }
  };

  const triggerLocalNotification = (title: string, message: string) => {
    if (localNotificationsEnabled) {
      try {
        Vibration.vibrate([0, 250, 150, 250]);
      } catch {}
      Alert.alert(`🔔 ${title}`, message);
    }
  };

  // Permissions (Step 1)
  const [permissions, setPermissions] = useState<AppPermissions>({
    usageAccess: false,
    notifications: false,
    screenOverlay: false,
    accessibilityService: false,
  });

  const [focusSession, setFocusSession] = useState<FocusSession>({
    isActive: false,
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    blockedApps: [],
  });

  const togglePermission = (key: keyof AppPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Single Limits
  const addAppLimit = (name: string, limitMinutes: number, category = 'Social') => {
    const formattedName = name.trim();
    if (!formattedName || isNaN(limitMinutes) || limitMinutes <= 0) return;

    setAppLimits((prev) => {
      // If limit already exists for this app, update its limit instead of creating a duplicate key!
      const existing = prev.find(
        (a) => a.name.toLowerCase() === formattedName.toLowerCase()
      );
      if (existing) {
        savePersistedAppLimitAsync({
          id: existing.id,
          name: existing.name,
          category,
          limit_minutes: limitMinutes,
          created_at: Date.now(),
        });
        return prev.map((a) =>
          a.id === existing.id
            ? { ...a, limit: limitMinutes, category }
            : a
        );
      }

      const newId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Persist to local SQLite
      savePersistedAppLimitAsync({
        id: newId,
        name: formattedName,
        category,
        limit_minutes: limitMinutes,
        created_at: Date.now(),
      });

      return [
        ...prev,
        {
          id: newId,
          name: formattedName,
          used: 0,
          limit: limitMinutes,
          category,
        },
      ];
    });
  };

  const deleteAppLimit = (id: string) => {
    setAppLimits((prev) => prev.filter((app) => app.id !== id));
    deletePersistedAppLimitAsync(id);
  };

  const logAppUsage = (id: string, minutes: number) => {
    setAppLimits((prev) => {
      const updated = prev.map((app) =>
        app.id === id ? { ...app, used: Math.max(0, app.used + minutes) } : app
      );

      const targetApp = updated.find((a) => a.id === id);
      if (targetApp) {
        // Persist daily usage delta directly into local SQLite
        recordDailyAppUsageAsync({
          appId: targetApp.id,
          appName: targetApp.name,
          category: targetApp.category,
          minutesDelta: minutes,
        });

        // Connect screen-time limits to SQLite-backed notifications
        if (localNotificationsEnabled && minutes > 0 && targetApp.limit > 0) {
          checkAndNotifyAppLimitAsync(targetApp);
        }
      }

      return updated;
    });
  };

  const resetAllUsage = () => {
    setAppLimits((prev) => prev.map((app) => ({ ...app, used: 0 })));
    setCombinedLimits((prev) => prev.map((bundle) => ({ ...bundle, used: 0 })));
    setHourlyUsage([]);
    clearSentNotificationsAsync(getTodayDateKey());
    resetDailyUsageForDateAsync(getTodayDateKey());
  };

  const clearAllData = () => {
    setAppLimits([]);
    setCombinedLimits([]);
    setInAppRules([]);
    setFriends([]);
    setHourlyUsage([]);
    setDeviceApps([]);
    clearNotificationHistory();
    clearAllPersistedAppDataAsync();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('sb_device_apps');
        window.localStorage.removeItem('sb_notification_history');
      } catch {}
    }
  };

  // Combined Limits management
  const addCombinedLimit = (name: string, appNames: string[], limitMinutes: number) => {
    if (!name.trim() || appNames.length === 0 || limitMinutes <= 0) return;
    setCombinedLimits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim(),
        appNames,
        limit: limitMinutes,
        used: 0,
      },
    ]);
  };

  const deleteCombinedLimit = (id: string) => {
    setCombinedLimits((prev) => prev.filter((item) => item.id !== id));
  };

  const logCombinedUsage = (id: string, minutes: number) => {
    setCombinedLimits((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, used: Math.max(0, item.used + minutes) } : item
      );

      // Connect combined screen-time limits to SQLite-backed notifications
      if (localNotificationsEnabled && minutes > 0) {
        const targetBundle = updated.find((b) => b.id === id);
        if (targetBundle && targetBundle.limit > 0) {
          checkAndNotifyAppLimitAsync({
            id: `bundle-${targetBundle.id}`,
            name: targetBundle.name,
            limit: targetBundle.limit,
            used: targetBundle.used,
          });
        }
      }

      return updated;
    });
  };

  // In-app granular rule management
  const addInAppRule = (rule: {
    appName: string;
    packageName?: string;
    appIcon?: string;
    featureName: string;
    description: string;
  }) => {
    if (!rule.appName.trim() || !rule.featureName.trim()) return;
    const newId = `shield_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setInAppRules((prev) => [
      ...prev,
      {
        id: newId,
        appName: rule.appName.trim(),
        packageName: rule.packageName || rule.appName.toLowerCase().replace(/\s+/g, ''),
        appIcon: rule.appIcon || '🛡️',
        featureName: rule.featureName.trim(),
        description: rule.description.trim() || `Granular shield for ${rule.featureName.trim()} inside ${rule.appName.trim()}`,
        isEnabled: true,
        blocksPrevented: 0,
      },
    ]);

    savePersistedInAppShieldAsync({
      id: newId,
      package_name: rule.packageName || rule.appName.toLowerCase().replace(/\s+/g, ''),
      app_name: rule.appName.trim(),
      feature_name: rule.featureName.trim(),
      blocked_keywords: rule.featureName.trim(),
      is_enabled: true,
      blocks_prevented: 0,
      created_at: Date.now(),
    });
  };

  const deleteInAppRule = (id: string) => {
    setInAppRules((prev) => prev.filter((r) => r.id !== id));
    deletePersistedInAppShieldAsync(id);
  };

  const toggleInAppRule = (id: string) => {
    setInAppRules((prev) =>
      prev.map((rule) => {
        if (rule.id === id) {
          const nextState = !rule.isEnabled;
          togglePersistedInAppShieldAsync(id, nextState);
          return { ...rule, isEnabled: nextState };
        }
        return rule;
      })
    );
  };

  // Study and Sleep Schedules management (100% on-device SQLite persisted)
  const addSchedule = async (schedule: Omit<ScheduleItem, 'id' | 'isEnabled'>) => {
    const newId = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ScheduleItem = {
      ...schedule,
      id: newId,
      isEnabled: true,
    };
    setSchedules((prev) => [...prev, newItem]);
    await savePersistedScheduleAsync({
      id: newId,
      name: newItem.name,
      type: newItem.type,
      start_time: newItem.startTime,
      end_time: newItem.endTime,
      days_active: JSON.stringify(newItem.daysActive),
      is_enabled: true,
      blocked_apps: JSON.stringify(newItem.blockedApps),
    });
  };

  const deleteSchedule = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    await deletePersistedScheduleAsync(id);
  };

  const toggleSchedule = async (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s))
    );
    await togglePersistedScheduleAsync(id);
  };

  // Friends management
  const addFriend = (name: string, avgMinutes = 60, streak = 1) => {
    if (!name.trim()) return;
    setFriends((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim(),
        avatar: '🤝',
        avgDailyMinutes: Math.max(0, avgMinutes),
        streakDays: Math.max(1, streak),
      },
    ]);
  };

  const removeFriend = (id: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  // Hourly Analytics logger
  const logHourlyUsage = (timeLabel: string, minutes: number) => {
    setHourlyUsage((prev) => {
      const existing = prev.find((p) => p.timeLabel === timeLabel);
      if (existing) {
        return prev.map((p) =>
          p.timeLabel === timeLabel ? { ...p, minutes: p.minutes + minutes } : p
        );
      }
      return [...prev, { timeLabel, minutes }];
    });
  };

  const startFocusSession = (minutes: number) => {
    const totalSecs = minutes * 60;
    setFocusSession((prev) => ({
      ...prev,
      isActive: true,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
    }));
  };

  const cancelFocusSession = () => {
    setFocusSession((prev) => ({
      ...prev,
      isActive: false,
      remainingSeconds: prev.totalSeconds,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        registeredUsers,
        registerAccount,
        loginAccount,
        doesEmailExist,
        resetPassword,
        deviceApps,
        addDeviceApp,
        removeDeviceApp,
        setDeviceApps,
        appLimits,
        addAppLimit,
        deleteAppLimit,
        logAppUsage,
        resetAllUsage,
        clearAllData,
        combinedLimits,
        addCombinedLimit,
        deleteCombinedLimit,
        logCombinedUsage,
        inAppRules,
        addInAppRule,
        deleteInAppRule,
        toggleInAppRule,
        schedules,
        addSchedule,
        deleteSchedule,
        toggleSchedule,
        friends,
        addFriend,
        removeFriend,
        localNotificationsEnabled,
        toggleLocalNotifications,
        triggerLocalNotification,
        notificationHistory,
        activeToast,
        dismissToast,
        activeThresholds,
        toggleThreshold,
        triggerDynamicNotification,
        checkAndNotifyAppLimitAsync,
        clearNotificationHistory,
        deleteNotificationHistoryItem,
        hourlyUsage,
        logHourlyUsage,
        focusSession,
        startFocusSession,
        cancelFocusSession,
        permissions,
        setPermissions,
        togglePermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
