import React, { createContext, useContext, useState } from 'react';
import { Alert, Vibration } from 'react-native';

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
  appIcon: string;
  featureName: string;
  description: string;
  isEnabled: boolean;
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

interface AppContextType {
  user: { name: string; email: string } | null;
  setUser: (user: { name: string; email: string } | null) => void;

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

  // Combined Limits (Step 3)
  combinedLimits: CombinedLimit[];
  addCombinedLimit: (name: string, appNames: string[], limitMinutes: number) => void;
  deleteCombinedLimit: (id: string) => void;
  logCombinedUsage: (id: string, minutes: number) => void;

  // In-App Granular Blocking (Step 2)
  inAppRules: InAppBlockRule[];
  addInAppRule: (rule: { appName: string; appIcon?: string; featureName: string; description: string }) => void;
  deleteInAppRule: (id: string) => void;
  toggleInAppRule: (id: string) => void;

  // Friends & Social Accountability (Step 5)
  friends: Friend[];
  addFriend: (name: string) => void;
  removeFriend: (id: string) => void;

  // Local Notifications & Alarms (100% On-Device, No Cloud / No Backend)
  localNotificationsEnabled: boolean;
  toggleLocalNotifications: () => void;
  triggerLocalNotification: (title: string, message: string) => void;

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

const DEFAULT_IN_APP_RULES: InAppBlockRule[] = [
  {
    id: 'yt-shorts',
    appName: 'YouTube',
    appIcon: '🎥',
    featureName: 'YouTube Shorts',
    description: 'Blocks addictive vertical Shorts feed while allowing normal long-form videos',
    isEnabled: true,
  },
  {
    id: 'yt-comments',
    appName: 'YouTube',
    appIcon: '💬',
    featureName: 'Comments Section',
    description: 'Hides comment feeds under videos to prevent mindless reading',
    isEnabled: false,
  },
  {
    id: 'yt-search',
    appName: 'YouTube',
    appIcon: '🔍',
    featureName: 'Video Search Bar',
    description: 'Restricts endless rabbit-hole video searches',
    isEnabled: false,
  },
  {
    id: 'ig-reels',
    appName: 'Instagram',
    appIcon: '📸',
    featureName: 'Reels Tab',
    description: 'Disables the bottom Reels tab while keeping direct messages active',
    isEnabled: true,
  },
  {
    id: 'ig-explore',
    appName: 'Instagram',
    appIcon: '🧭',
    featureName: 'Explore Grid',
    description: 'Hides the algorithmic discovery grid',
    isEnabled: true,
  },
  {
    id: 'tt-foryou',
    appName: 'TikTok',
    appIcon: '🎵',
    featureName: 'For You Page (Infinite Feed)',
    description: 'Stops automated infinite looping algorithm feed',
    isEnabled: true,
  },
  {
    id: 'fb-watch',
    appName: 'Facebook',
    appIcon: '👥',
    featureName: 'Watch / Reels Stream',
    description: 'Blocks short video stream recommendations',
    isEnabled: false,
  },
  {
    id: 'rd-popular',
    appName: 'Reddit',
    appIcon: '🤖',
    featureName: 'Popular / Discovery Feed',
    description: 'Restricts infinite scrolling to subscribed subreddits only',
    isEnabled: true,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Device Applications (Selected from Device, Zero Hardcoding)
  const [deviceApps, setDeviceApps] = useState<DeviceApp[]>([]);

  const addDeviceApp = (name: string, category = 'Social', icon = '📱') => {
    const formatted = name.trim();
    if (!formatted) return;
    setDeviceApps((prev) => {
      if (prev.some((a) => a.name.toLowerCase() === formatted.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          id: Date.now().toString(),
          name: formatted,
          category,
          icon,
          isDetected: true,
        },
      ];
    });
  };

  const removeDeviceApp = (id: string) => {
    setDeviceApps((prev) => prev.filter((a) => a.id !== id));
  };

  // Individual App Limits (starts empty)
  const [appLimits, setAppLimits] = useState<AppLimit[]>([]);

  // Combined Limits (Step 3: starts empty)
  const [combinedLimits, setCombinedLimits] = useState<CombinedLimit[]>([]);

  // In-App Granular Blocking (Step 2: restored with clean non-image vector shields)
  const [inAppRules, setInAppRules] = useState<InAppBlockRule[]>(DEFAULT_IN_APP_RULES);

  // Friends & Social Accountability (Step 5: starts empty)
  const [friends, setFriends] = useState<Friend[]>([]);

  // Hourly Analytics Data (Step 4: starts empty)
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsagePoint[]>([]);

  // Local Notifications & Alarms (100% On-Device, No Backend / No Cloud)
  const [localNotificationsEnabled, setLocalNotificationsEnabled] = useState(true);

  const toggleLocalNotifications = () => {
    setLocalNotificationsEnabled((prev) => !prev);
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
    usageAccess: true,
    notifications: true,
    screenOverlay: true,
    accessibilityService: true,
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

    setAppLimits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: formattedName,
        used: 0,
        limit: limitMinutes,
        category,
      },
    ]);
  };

  const deleteAppLimit = (id: string) => {
    setAppLimits((prev) => prev.filter((app) => app.id !== id));
  };

  const logAppUsage = (id: string, minutes: number) => {
    setAppLimits((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, used: Math.max(0, app.used + minutes) } : app
      )
    );
  };

  const resetAllUsage = () => {
    setAppLimits((prev) => prev.map((app) => ({ ...app, used: 0 })));
    setCombinedLimits((prev) => prev.map((bundle) => ({ ...bundle, used: 0 })));
    setHourlyUsage([]);
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
    setCombinedLimits((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, used: Math.max(0, item.used + minutes) } : item
      )
    );
  };

  // In-app granular rule management
  const addInAppRule = (rule: {
    appName: string;
    appIcon?: string;
    featureName: string;
    description: string;
  }) => {
    if (!rule.appName.trim() || !rule.featureName.trim()) return;
    setInAppRules((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        appName: rule.appName.trim(),
        appIcon: rule.appIcon || '🛡️',
        featureName: rule.featureName.trim(),
        description: rule.description.trim() || `Granular shield for ${rule.featureName}`,
        isEnabled: true,
      },
    ]);
  };

  const deleteInAppRule = (id: string) => {
    setInAppRules((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleInAppRule = (id: string) => {
    setInAppRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, isEnabled: !rule.isEnabled } : rule
      )
    );
  };

  // Friends management
  const addFriend = (name: string) => {
    if (!name.trim()) return;
    setFriends((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name.trim(),
        avatar: '🤝',
        avgDailyMinutes: 0,
        streakDays: 1,
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
        deviceApps,
        addDeviceApp,
        removeDeviceApp,
        setDeviceApps,
        appLimits,
        addAppLimit,
        deleteAppLimit,
        logAppUsage,
        resetAllUsage,
        combinedLimits,
        addCombinedLimit,
        deleteCombinedLimit,
        logCombinedUsage,
        inAppRules,
        addInAppRule,
        deleteInAppRule,
        toggleInAppRule,
        friends,
        addFriend,
        removeFriend,
        localNotificationsEnabled,
        toggleLocalNotifications,
        triggerLocalNotification,
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
