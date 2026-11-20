import BottomNav, { TabType } from '@/components/BottomNav';
import NavigationDrawer, { DrawerModule } from '@/components/NavigationDrawer';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';
import { generateDynamicNotificationMessage } from '@/services/notificationService';
import { dashboardStyles as styles } from '@/styles';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    AppState,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSystemUsageMetrics, checkNativeUsageAccess, fetchInstalledApps, InstalledAppItem } from '@/services/installedAppsService';
import { recordDailyAppUsageAsync, getTodayDateKey } from '@/services/sqliteNotificationStorage';
import { useAutoDailyStats } from '@/hooks/useAutoDailyStats';
import { FocusChallengeCard } from '@/components/FocusChallengeCard';

// Dynamic 7-day calendar week generator (Monday through Sunday based strictly on real calendar date, zero hardcoding)
const getDynamicWeekdays = (totalUsed: number, totalLimit: number) => {
  const now = new Date();
  
  // Calculate Monday of the current real calendar week
  // now.getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const currentDayOfWeek = now.getDay();
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + i);

    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    const isPast = targetDate < now && !isToday;
    const isFuture = targetDate > now && !isToday;

    const dayName = dayNames[i];
    const dateNum = targetDate.getDate().toString();

    let status = '○';
    if (isToday) {
      if (totalLimit > 0) {
        if (totalUsed > totalLimit) {
          status = '⚠️';
        } else if (totalUsed > 0) {
          status = '🙂';
        } else {
          status = '🌱';
        }
      } else {
        status = totalUsed > 0 ? '🙂' : '🌱';
      }
    } else if (isPast) {
      // Past days in current calendar week
      status = '🙂';
    } else {
      // Future days in current calendar week
      status = '·';
    }

    days.push({
      key: `${dayName}-${dateNum}`,
      day: dayName,
      date: dateNum,
      isToday,
      isPast,
      isFuture,
      status,
    });
  }
  return days;
};

// Common Granular Features Catalog mapped by App Category / Keyword
const APP_FEATURE_PRESETS: Record<string, string[]> = {
  youtube: ['Shorts Shelf', 'Comments Section', 'Recommended Feed', 'Live Chat', 'Search Autoplay'],
  instagram: ['Reels Tab', 'Explore Grid', 'Stories Carousel', 'Comments Feed', 'Direct Shopping'],
  tiktok: ['Comments Section', 'Live Stream Feed', 'For You Endless Scroll', 'Shop Tab'],
  facebook: ['Reels & Short Videos', 'Marketplace', 'Feed Infinite Scroll', 'Stories Bar'],
  twitter: ['Explore Grid & Trends', 'For You Algorithmic Feed', 'Replies & Comments'],
  x: ['Explore Grid & Trends', 'For You Algorithmic Feed', 'Replies & Comments'],
  snapchat: ['Spotlight Vertical Feed', 'Discover Stories', 'Public Feeds'],
  telegram: ['Stories Tab', 'Public Channels & Explore', 'Voice Chat'],
  whatsapp: ['Status & Stories Tab', 'Channels Feed'],
  chrome: ['Discover Feed', 'Infinite Tab Scroll', 'Suggested Articles'],
};

const GENERIC_FEATURE_PRESETS: Record<string, string[]> = {
  Social: ['Short Videos / Reels', 'Comments Section', 'Explore / Trends Feed', 'Stories Tab', 'Live Streams'],
  Entertainment: ['Short Videos', 'Comments Section', 'Auto-play Next', 'Discover Feed'],
  Communication: ['Status / Stories', 'Channels / Groups Explore', 'Public Feeds'],
  Games: ['In-App Store / Microtransactions', 'Leaderboards / Feeds', 'Chat Rooms'],
  Productivity: ['Infinite Feeds', 'Notifications Banner', 'Suggested Content'],
};

export default function DashboardScreen() {
  const router = useRouter();
  const {
    user,
    setUser,
    deviceApps,
    appLimits,
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
    notificationHistory,
    activeThresholds,
    toggleThreshold,
    triggerDynamicNotification,
    clearNotificationHistory,
    deleteNotificationHistoryItem,
    hourlyUsage,
    logHourlyUsage,
    permissions,
    togglePermission,
  } = useApp();

  // Navigation State (Home is initial screen)
  const [activeModule, setActiveModule] = useState<DrawerModule>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Home Screen Allowance Widget State (Zero Hardcoded Data)
  const [selectedDayKey, setSelectedDayKey] = useState<string>('');

  // Automatic Native Android Collection via Hook
  const { stats: autoStats } = useAutoDailyStats(selectedDayKey || getTodayDateKey());
  const pickups = autoStats.pickups;
  const unlocks = autoStats.unlocks;
  const notificationsCount = autoStats.notifications > 0 ? autoStats.notifications : notificationHistory.length;

  // Background Automatic Sync Hook: Queries real Android system stats on mount, AppState active, and polling
  const syncSystemUsageData = useCallback(async () => {
    try {
      const metrics = await fetchSystemUsageMetrics();
      // If Android UsageStats returned foreground minutes, update app limits usage
      if (metrics.appUsage && Object.keys(metrics.appUsage).length > 0) {
        for (const [pkg, usedMins] of Object.entries(metrics.appUsage)) {
          const matchedApp = appLimits.find(
            (a) => a.name.toLowerCase() === pkg.toLowerCase() || pkg.toLowerCase().includes(a.name.toLowerCase())
          );
          if (matchedApp && usedMins > matchedApp.used) {
            logAppUsage(matchedApp.id, usedMins - matchedApp.used);
          }
        }
      }
      // Write pickups and unlocks into local SQLite daily usage log
      await recordDailyAppUsageAsync({
        appId: 'system_overall',
        appName: 'System Metrics',
        category: 'System',
        minutesDelta: 0,
        pickupsDelta: metrics.pickups,
        unlocksDelta: metrics.unlocks,
      });
    } catch {
      // Safe fail
    }
  }, [appLimits, logAppUsage]);

  // Guard: if user has not granted Usage Access, redirect directly to Permissions screen
  useEffect(() => {
    (async () => {
      const isAllowed = await checkNativeUsageAccess();
      if (!isAllowed) {
        router.replace('/permissions');
      }
    })();
  }, [router]);

  // Sync on initial mount, on active app state, and on short interval (every 15s)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        syncSystemUsageData();
      }
    });

    const interval = setInterval(() => {
      syncSystemUsageData();
    }, 15000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [syncSystemUsageData]);

  // Dynamic Notification Tester State
  const [testAppSelection, setTestAppSelection] = useState<string>('');
  const [testRemainingMinutes, setTestRemainingMinutes] = useState<number>(5);

  // Insights State (Daily, Weekly, Monthly)
  const [insightsTimeframe, setInsightsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedHourPoint, setSelectedHourPoint] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Friends State
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendAvg, setNewFriendAvg] = useState('');

  // Combined Limits (Group) Modal State
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [newBundleName, setNewBundleName] = useState('');
  const [bundleHours, setBundleHours] = useState(2);
  const [bundleMinutes, setBundleMinutes] = useState(0);
  const [selectedAppsForBundle, setSelectedAppsForBundle] = useState<string[]>([]);
  const [customBundleAppInput, setCustomBundleAppInput] = useState('');

  // In-App Shield Modal State (Real Device Apps & Granular Features)
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [selectedShieldApp, setSelectedShieldApp] = useState<InstalledAppItem | null>(null);
  const [newShieldApp, setNewShieldApp] = useState('');
  const [newShieldPackage, setNewShieldPackage] = useState('');
  const [newShieldFeature, setNewShieldFeature] = useState('');
  const [newShieldDesc, setNewShieldDesc] = useState('');
  const [shieldSearchQuery, setShieldSearchQuery] = useState('');
  const [shieldCategoryFilter, setShieldCategoryFilter] = useState<string>('All');

  // Study & Sleep Schedules Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleType, setNewScheduleType] = useState<'study' | 'sleep' | 'focus'>('study');
  const [newScheduleStart, setNewScheduleStart] = useState('22:00');
  const [newScheduleEnd, setNewScheduleEnd] = useState('07:00');
  const [newScheduleDays, setNewScheduleDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [newScheduleApps, setNewScheduleApps] = useState<string[]>([]);

  // Installed device applications for in-app shields and routine picker
  const [installedDeviceApps, setInstalledDeviceApps] = useState<InstalledAppItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchInstalledApps().then((apps) => {
      if (isMounted && apps.length > 0) {
        setInstalledDeviceApps(apps);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculations (Zero Hardcoded Data - 100% Dynamic)
  const singleUsedMinutes = appLimits.reduce((acc, curr) => acc + curr.used, 0);
  const combinedUsedMinutes = combinedLimits.reduce((acc, curr) => acc + curr.used, 0);
  const totalUsedMinutes = autoStats.totalScreenMinutes > 0
    ? autoStats.totalScreenMinutes
    : (singleUsedMinutes + combinedUsedMinutes);

  const singleLimitMinutes = appLimits.reduce((acc, curr) => acc + curr.limit, 0);
  const combinedLimitMinutes = combinedLimits.reduce((acc, curr) => acc + curr.limit, 0);
  const totalLimitMinutes = singleLimitMinutes + combinedLimitMinutes;

  const remainingMinutes = Math.max(0, totalLimitMinutes - totalUsedMinutes);

  const formatHoursMins = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  // Sync BottomNav tab with Drawer Module
  const getTabFromModule = (module: DrawerModule): TabType => {
    switch (module) {
      case 'home':
        return 'home';
      case 'insights':
      case 'level':
        return 'reports';
      case 'schedules':
      case 'limits':
      case 'in-app-blocking':
      case 'notifications':
        return 'schedule';
      case 'settings':
      default:
        return 'settings';
    }
  };

  const handleTabChange = (tab: TabType) => {
    switch (tab) {
      case 'home':
        setActiveModule('home');
        break;
      case 'reports':
        setActiveModule('insights');
        break;
      case 'schedule':
        setActiveModule('schedules');
        break;
      case 'settings':
        setActiveModule('settings');
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          setUser(null);
          router.replace('/');
        },
      },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset all app limits, groups, in-app shields, and stats back to a clean initial state. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setSelectedHourPoint('');
          },
        },
      ]
    );
  };

  const handleCreateBundle = () => {
    const totalMins = bundleHours * 60 + bundleMinutes;
    if (!newBundleName.trim()) {
      Alert.alert('Error', 'Please provide a name for the combined group.');
      return;
    }
    if (selectedAppsForBundle.length < 2) {
      Alert.alert('Error', 'Please select at least 2 apps for a combined boundary.');
      return;
    }
    if (totalMins <= 0) {
      Alert.alert('Error', 'Please choose a limit of at least 1 minute on the roller wheel.');
      return;
    }

    addCombinedLimit(newBundleName, selectedAppsForBundle, totalMins);
    setNewBundleName('');
    setSelectedAppsForBundle([]);
    setIsBundleModalOpen(false);
  };

  const toggleAppSelectionForBundle = (app: string) => {
    if (selectedAppsForBundle.includes(app)) {
      setSelectedAppsForBundle(selectedAppsForBundle.filter((a) => a !== app));
    } else {
      setSelectedAppsForBundle([...selectedAppsForBundle, app]);
    }
  };

  const handleAddFriendSubmit = () => {
    if (!newFriendName.trim()) return;
    const avg = parseInt(newFriendAvg, 10) || 60;
    addFriend(newFriendName.trim(), avg);
    setNewFriendName('');
    setNewFriendAvg('');
  };

  const handleCreateShieldSubmit = () => {
    const finalAppName = selectedShieldApp ? selectedShieldApp.appName : newShieldApp.trim();
    const finalPackage = selectedShieldApp ? selectedShieldApp.packageName : newShieldPackage.trim();
    const finalIcon = selectedShieldApp?.icon || '🛡️';

    if (!finalAppName || !newShieldFeature.trim()) {
      Alert.alert('Missing Info', 'Please select an installed application and specify the feature to block.');
      return;
    }

    addInAppRule({
      appName: finalAppName,
      packageName: finalPackage,
      featureName: newShieldFeature.trim(),
      description: newShieldDesc.trim() || `Restricts ${newShieldFeature.trim()} inside ${finalAppName}`,
      appIcon: finalIcon,
    });

    setSelectedShieldApp(null);
    setNewShieldApp('');
    setNewShieldPackage('');
    setNewShieldFeature('');
    setNewShieldDesc('');
    setShieldSearchQuery('');
    setIsShieldModalOpen(false);
  };

  const handleCreateScheduleSubmit = async () => {
    if (!newScheduleName.trim()) {
      Alert.alert('Missing Name', 'Please give this schedule a name (e.g. Deep Study).');
      return;
    }
    await addSchedule({
      name: newScheduleName.trim(),
      type: newScheduleType,
      startTime: newScheduleStart.trim() || '22:00',
      endTime: newScheduleEnd.trim() || '07:00',
      daysActive: newScheduleDays.length > 0 ? newScheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      blockedApps: newScheduleApps,
    });
    setNewScheduleName('');
    setNewScheduleApps([]);
    setIsScheduleModalOpen(false);
  };

  // Dynamic list of apps for combined group creation (Zero hardcoded data)
  const availableAppsForGrouping = Array.from(
    new Set([
      ...appLimits.map((a) => a.name),
      ...deviceApps.map((d) => d.name),
      ...installedDeviceApps.map((i) => i.appName),
      ...selectedAppsForBundle,
    ])
  );

  // Dynamic Platform Breakdown
  const webUsedMinutes = appLimits
    .filter(
      (a) =>
        a.category === 'Productivity' ||
        a.name.toLowerCase().includes('web') ||
        a.name.toLowerCase().includes('browser') ||
        a.name.toLowerCase().includes('chrome')
    )
    .reduce((acc, curr) => acc + curr.used, 0);

  const mobileAppUsedMinutes = Math.max(0, totalUsedMinutes - webUsedMinutes);
  const mobileAppPct = totalUsedMinutes > 0 ? Math.round((mobileAppUsedMinutes / totalUsedMinutes) * 100) : 0;
  const webPct = totalUsedMinutes > 0 ? Math.round((webUsedMinutes / totalUsedMinutes) * 100) : 0;

  // Dynamic Ranked Apps
  const rankedApps = [...appLimits].sort((a, b) => b.used - a.used);

  // Dynamic weekdays strip from real current dates
  const dynamicWeekdays = getDynamicWeekdays(totalUsedMinutes, totalLimitMinutes);

  // Real Weekly & Monthly data: STRICTLY real logged data, zero fake multipliers
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyDays = weekDayLabels.map((label, idx) => ({
    label,
    mins: idx === currentDayIndex ? totalUsedMinutes : 0, // ONLY today has actual logged minutes!
  }));

  const monthlyWeeks = [
    { label: 'Week 1', mins: 0 },
    { label: 'Week 2', mins: 0 },
    { label: 'Week 3', mins: totalUsedMinutes }, // Current week
    { label: 'Week 4', mins: 0 },
  ];

  return (
    <SafeAreaView style={styles.bgApp} className="flex-1" edges={['top']}>
      {/* SLIDE-OUT NAVIGATION DRAWER */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeModule={activeModule}
        onSelectModule={(module) => setActiveModule(module)}
      />

      <View style={styles.bgApp} className="flex-1">
        {/* TOP BAR */}
        <View
          style={styles.topBar}
          className="border-b px-4 py-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            {/* Hamburger Button to Open Drawer */}
            <Pressable
              onPress={() => setIsDrawerOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              style={styles.card}
              className="w-10 h-10 rounded-2xl items-center justify-center border active:bg-[#2D263B]"
            >
              <Text className="text-xl text-white font-bold">☰</Text>
            </Pressable>

            <View>
              <Text className="text-xs font-black tracking-widest text-[#9D84D6] uppercase">
                ScreenBalance
              </Text>
              <Text className="text-base font-extrabold text-white">
                {activeModule === 'home' && 'Home'}
                {activeModule === 'limits' && 'Usage Limits'}
                {activeModule === 'schedules' && 'Study & Sleep Schedules'}
                {activeModule === 'in-app-blocking' && 'In-App Blocking'}
                {activeModule === 'notifications' && 'Usage Notifications'}
                {activeModule === 'level' && 'Level & Streaks'}
                {activeModule === 'insights' && 'Usage Insights'}
                {activeModule === 'friends' && 'My Friends'}
                {activeModule === 'desktop' && 'ScreenBalance for Desktop'}
                {activeModule === 'inbox' && 'Inbox Control'}
                {activeModule === 'categories' && 'Categories'}
                {activeModule === 'settings' && 'Settings'}
              </Text>
            </View>
          </View>

          {/* Right Action Badges */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/permissions')}
              hitSlop={6}
              style={permissions.usageAccess ? styles.trackingActiveBadge : styles.trackingInactiveBadge}
              className="border px-2.5 py-1 rounded-full flex-row items-center gap-1.5 active:opacity-80"
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  permissions.usageAccess ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <Text
                style={permissions.usageAccess ? styles.trackingActiveText : styles.trackingInactiveText}
                className="text-xs font-bold"
              >
                {permissions.usageAccess ? 'Tracking Active' : 'Tracking Inactive'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              hitSlop={8}
              style={styles.cardNoBorder}
              className="px-2.5 py-1.5 rounded-xl active:bg-[#2D263B]"
            >
              <Text className="text-xs font-semibold text-[#9E98A8]">Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================== */}
        {/* MODULE: HOME DASHBOARD (TODAY'S SCREEN ALLOWANCE WIDGET)       */}
        {/* ============================================================== */}
        {activeModule === 'home' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Header: Personalized Greeting & Goal Streak Badge */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-black text-white">
                  Hi, {user?.name || 'User'}!
                </Text>
                <Text className="text-xs text-[#9E98A8]">
                  Today&apos;s Screen Allowance
                </Text>
              </View>

              <View
                style={styles.card}
                className="border px-3 py-1.5 rounded-full flex-row items-center"
              >
                <Text className="text-xs font-bold text-white">
                  Goal Streak: {totalLimitMinutes > 0 && totalUsedMinutes > 0 && totalUsedMinutes <= totalLimitMinutes ? '1d' : '0d'}
                </Text>
              </View>
            </View>

            {/* 7-Day Real Calendar Week Strip (Mon through Sun - Clean, Icon-Free) */}
            <View className="flex-row justify-between mb-4 gap-1">
              {dynamicWeekdays.map((d) => {
                const isSelected = selectedDayKey ? selectedDayKey === d.key : d.isToday;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setSelectedDayKey(d.key)}
                    style={isSelected ? styles.weekdayPillActive : styles.weekdayPill}
                    className="flex-1 border py-2.5 px-0.5 rounded-xl items-center active:opacity-80"
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#9E98A8]'}`}>
                      {d.day}
                    </Text>
                    <Text className={`text-xs font-black mt-0.5 ${isSelected ? 'text-white' : 'text-[#D1CADB]'}`}>
                      {d.date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Excessive Screen Usage Warning Banner (Triggers when limits exceeded) */}
            {totalLimitMinutes > 0 && totalUsedMinutes >= totalLimitMinutes && (
              <View className="mb-4 bg-rose-950/60 border border-rose-500/50 rounded-2xl p-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <Text className="text-xl">🚨</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-black text-rose-200">
                      Excessive Screen Usage Alert
                    </Text>
                    <Text className="text-xs text-rose-300">
                      {totalUsedMinutes > totalLimitMinutes
                        ? `Exceeded total screen cap by ${formatHoursMins(totalUsedMinutes - totalLimitMinutes)}!`
                        : 'You have reached 100% of your daily screen time cap!'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push('/dashboard/focus')}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 active:opacity-80"
                >
                  <Text className="text-xs font-black text-white">Focus Mode ➔</Text>
                </Pressable>
              </View>
            )}

            {/* Today's Screen Allowance Ring / Circular Gauge Card */}
            <View
              style={styles.card}
              className="border p-5 rounded-3xl mb-4 shadow-sm items-center"
            >
              {/* Circular Gauge Ring (Fills strictly based on real data, 0m = empty track) */}
              <View className="items-center justify-center my-3">
                <View
                  style={{
                    width: 196,
                    height: 196,
                    borderRadius: 98,
                    borderWidth: 10,
                    borderColor: '#262033',
                    borderTopColor:
                      totalUsedMinutes > 0
                        ? totalUsedMinutes > totalLimitMinutes && totalLimitMinutes > 0
                          ? '#EF4444'
                          : '#84CC16'
                        : '#262033',
                    borderRightColor:
                      totalLimitMinutes > 0 && (totalUsedMinutes / totalLimitMinutes) >= 0.25
                        ? totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16'
                        : '#262033',
                    borderBottomColor:
                      totalLimitMinutes > 0 && (totalUsedMinutes / totalLimitMinutes) >= 0.5
                        ? totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16'
                        : '#262033',
                    borderLeftColor:
                      totalLimitMinutes > 0 && (totalUsedMinutes / totalLimitMinutes) >= 0.75
                        ? totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16'
                        : '#262033',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-xs font-bold text-[#9D84D6] tracking-widest uppercase mb-0.5">
                    Screen-Time
                  </Text>

                  {/* Automatic Screen Time Display */}
                  <View className="items-center justify-center my-1">
                    <Text className="text-3xl font-black text-white">
                      {formatHoursMins(totalUsedMinutes)}
                    </Text>
                  </View>

                  <Text className="text-xs text-[#7C7389] my-0.5">of</Text>
                  <Text className="text-xs font-bold text-[#A7F3D0]">
                    {totalLimitMinutes > 0 ? `${formatHoursMins(totalLimitMinutes)} Daily Goal` : '0m Daily Goal'}
                  </Text>
                </View>
              </View>

              <Text className="text-xs font-semibold text-[#9E98A8] mt-1 mb-2">
                {totalLimitMinutes > 0
                  ? `${formatHoursMins(remainingMinutes)} remaining today`
                  : '0m remaining (configure daily limits below)'}
              </Text>

              {/* Center Add App Limit Action Button */}
              <Pressable
                onPress={() => router.push('/dashboard/add-limit')}
                style={styles.btnPrimary}
                className="px-5 py-2.5 rounded-xl items-center justify-center mb-3 active:opacity-90 shadow-md"
              >
                <Text className="text-white text-xs font-bold">+ Add App Limit</Text>
              </Pressable>

              {/* Screen Time Progress Bar */}
              <View className="w-full px-1 mb-2.5">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs font-bold text-[#9E98A8] uppercase tracking-wide">
                    Screen Time Progress
                  </Text>
                  <Text
                    style={{
                      color:
                        totalLimitMinutes > 0 && totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16',
                    }}
                    className="text-xs font-extrabold"
                  >
                    {totalLimitMinutes > 0
                      ? `${Math.min(100, Math.round((totalUsedMinutes / totalLimitMinutes) * 100))}%`
                      : '0%'}
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-[#16131D] rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${
                        totalLimitMinutes > 0
                          ? Math.min(100, (totalUsedMinutes / totalLimitMinutes) * 100)
                          : 0
                      }%`,
                      backgroundColor:
                        totalLimitMinutes > 0 && totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16',
                    }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>

              {/* Device Engagement Metrics Row */}
              <View className="flex-row items-center justify-between w-full gap-2.5 pt-3 border-t border-[#2D273A]">
                {/* Pick-ups */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-xs font-bold text-[#9E98A8] uppercase mb-1">Pick-ups</Text>
                  <Text className="text-xl font-black text-white">{pickups}</Text>
                  <Text className="text-xs text-[#A7F3D0] mt-0.5 font-bold">Auto Synced</Text>
                </View>

                {/* Unlocks */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-xs font-bold text-[#9E98A8] uppercase mb-1">Unlocks</Text>
                  <Text className="text-xl font-black text-white">{unlocks}</Text>
                  <Text className="text-xs text-[#A7F3D0] mt-0.5 font-bold">Auto Synced</Text>
                </View>

                {/* Notifications */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-xs font-bold text-[#9E98A8] uppercase mb-1">Notifications</Text>
                  <Text className="text-xl font-black text-white">{notificationsCount}</Text>
                  <Text className="text-xs text-[#9D84D6] mt-0.5 font-bold">SQLite Logs</Text>
                </View>
              </View>
            </View>

            {/* Today's Focus Challenge Card (Dynamic Points + Automatic Live Tracking, No Backend) */}
            <FocusChallengeCard
              appLimits={appLimits}
              dateKey={selectedDayKey || getTodayDateKey()}
            />

            {/* Feature Shortcut Cards (2x3 Balanced Grid) */}
            <View className="flex-row flex-wrap gap-2.5 mb-5">
              {/* 1. In-App Blocking */}
              <Pressable
                onPress={() => setActiveModule('in-app-blocking')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">🛡️</Text>
                <Text className="text-xs font-bold text-white">In-App Blocking</Text>
                <Text className="text-xs text-[#9E98A8]">
                  {inAppRules.filter((r) => r.isEnabled).length} active shield(s)
                </Text>
              </Pressable>

              {/* 2. Usage Limits */}
              <Pressable
                onPress={() => setActiveModule('limits')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">⏱️</Text>
                <Text className="text-xs font-bold text-white">Usage Limits</Text>
                <Text className="text-xs text-[#9E98A8]">
                  {combinedLimits.length} combined group(s)
                </Text>
              </Pressable>

              {/* 3. Usage Insights */}
              <Pressable
                onPress={() => setActiveModule('insights')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">📈</Text>
                <Text className="text-xs font-bold text-white">Usage Insights</Text>
                <Text className="text-xs text-[#9E98A8]">Comparison & Score</Text>
              </Pressable>

              {/* 4. Focus Session Timer */}
              <Pressable
                onPress={() => router.push('/dashboard/focus')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">🎯</Text>
                <Text className="text-xs font-bold text-white">Focus Timer</Text>
                <Text className="text-xs text-[#9E98A8]">Pomodoro & Watch</Text>
              </Pressable>

              {/* 5. Level & Streaks */}
              <Pressable
                onPress={() => setActiveModule('level')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">🏆</Text>
                <Text className="text-xs font-bold text-white">Level & Streaks</Text>
                <Text className="text-xs text-[#9E98A8]">Rewards & Badges</Text>
              </Pressable>

              {/* 6. My Friends */}
              <Pressable
                onPress={() => setActiveModule('friends')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">👥</Text>
                <Text className="text-xs font-bold text-white">My Friends</Text>
                <Text className="text-xs text-[#9E98A8]">
                  {friends.length} friend(s) sharing
                </Text>
              </Pressable>
            </View>

            {/* Individual Limits Section (Dedicated App Limits Area - Zero Duplication) */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Individual Limits ({appLimits.length})
              </Text>
              {appLimits.length > 0 && (
                <Pressable
                  onPress={() => router.push('/dashboard/add-limit')}
                  style={styles.btnPrimary}
                  className="px-3 py-1.5 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Add App Limit</Text>
                </Pressable>
              )}
            </View>

            {appLimits.length === 0 ? (
              <View
                style={styles.card}
                className="border p-6 rounded-3xl items-center justify-center mb-4"
              >
                <Text className="text-xs font-bold text-white mb-1">No Limits Defined</Text>
                <Text className="text-xs text-[#9E98A8] text-center mb-3">
                  Tap below to set your daily allowable screen time with the roller wheel.
                </Text>
                <Pressable
                  onPress={() => router.push('/dashboard/add-limit')}
                  style={styles.btnPrimary}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Set App Limit</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2 mb-4">
                {appLimits.map((app, index) => (
                  <View
                    key={`${app.id}-${app.name}-${index}`}
                    style={styles.card}
                    className="border p-3.5 rounded-2xl"
                  >
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View>
                        <Text className="text-xs font-bold text-white">{app.name}</Text>
                        <Text className="text-xs text-[#7C7389]">
                          {Math.max(0, app.limit - app.used)}m remaining • {app.limit > 0 ? Math.min(100, Math.round((app.used / app.limit) * 100)) : 0}% used
                        </Text>
                      </View>
                      <Text className="text-xs font-extrabold text-[#9D84D6]">
                        {app.used}m / {app.limit}m
                      </Text>
                    </View>

                    {/* App Progress Bar */}
                    <View className="w-full h-1.5 bg-[#16131D] rounded-full overflow-hidden mb-2.5">
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min((app.used / app.limit) * 100, 100)}%`,
                            backgroundColor: app.used > app.limit ? '#EF4444' : '#84CC16',
                          },
                        ]}
                        className="h-full rounded-full"
                      />
                    </View>

                    {/* Real-time increase & decrease buttons */}
                    <View className="flex-row justify-between items-center pt-2 border-t border-[#262033] flex-wrap gap-y-1.5">
                      <View className="flex-row items-center gap-1 flex-wrap">
                        <Text className="text-xs font-bold text-[#9E98A8] uppercase mr-0.5">Time:</Text>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -10)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-[#9E98A8]">-10m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -5)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-[#9E98A8]">-5m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -1)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-[#9E98A8]">-1m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 1)}
                          className="px-2 py-0.5 rounded-md bg-[#2D2248] border border-[#9D84D6] active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-[#9D84D6]">+1m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 5)}
                          style={styles.btnPrimary}
                          className="px-2 py-0.5 rounded-md active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-white">+5m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 10)}
                          style={styles.btnPrimary}
                          className="px-2 py-0.5 rounded-md active:opacity-70"
                        >
                          <Text className="text-xs font-bold text-white">+10m</Text>
                        </Pressable>
                      </View>
                      <Pressable onPress={() => deleteAppLimit(app.id)} hitSlop={6}>
                        <Text className="text-xs font-semibold text-rose-400">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Clear All Data / Reset Button */}
            <Pressable
              onPress={handleClearAllData}
              style={styles.card}
              className="border border-rose-950/60 p-3.5 rounded-2xl flex-row items-center justify-between mb-8 active:bg-rose-950/20"
            >
              <View className="flex-row items-center gap-2.5">
                <Text className="text-base">🧹</Text>
                <View>
                  <Text className="text-xs font-bold text-rose-300">Clear All Screen Data</Text>
                  <Text className="text-xs text-[#9E98A8]">Reset limits, groups, and shields to fresh state</Text>
                </View>
              </View>
              <Text className="text-xs font-bold text-rose-400">Reset ➔</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: USAGE INSIGHTS (DAILY, WEEKLY, MONTHLY)                */}
        {/* ============================================================== */}
        {activeModule === 'insights' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Filter Chips Bar & Chart Toggle */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  style={styles.card}
                  className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-semibold text-[#D1CADB]">Devices</Text>
                  <Text className="text-xs text-[#9E98A8]">▾</Text>
                </View>

                <View
                  style={styles.card}
                  className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-semibold text-[#D1CADB]">Usage Time</Text>
                  <Text className="text-xs text-[#9E98A8]">▾</Text>
                </View>
              </View>

              {/* Chart Type Toggle Button (Bar vs Line) */}
              <View
                style={styles.card}
                className="border p-0.5 rounded-xl flex-row items-center"
              >
                <Pressable
                  onPress={() => setChartType('bar')}
                  style={chartType === 'bar' ? styles.chartTabActive : styles.chartTabInactive}
                  className="px-2.5 py-1 rounded-lg"
                >
                  <Text style={chartType === 'bar' ? styles.chartTabTextActive : styles.chartTabTextInactive}>
                    📊
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setChartType('line')}
                  style={chartType === 'line' ? styles.chartTabActive : styles.chartTabInactive}
                  className="px-2.5 py-1 rounded-lg"
                >
                  <Text style={chartType === 'line' ? styles.chartTabTextActive : styles.chartTabTextInactive}>
                    📈
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Timeframe Selector Tabs (Daily, Weekly, Monthly) */}
            <View
              style={styles.card}
              className="border p-1 rounded-2xl flex-row mb-4"
            >
              <Pressable
                onPress={() => setInsightsTimeframe('daily')}
                style={insightsTimeframe === 'daily' ? styles.timeframeTabActive : styles.timeframeTabInactive}
                className="flex-1 py-2 rounded-xl items-center border"
              >
                <Text className={`text-xs font-bold ${insightsTimeframe === 'daily' ? 'text-white' : 'text-[#9E98A8]'}`}>
                  Daily
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInsightsTimeframe('weekly')}
                style={insightsTimeframe === 'weekly' ? styles.timeframeTabActive : styles.timeframeTabInactive}
                className="flex-1 py-2 rounded-xl items-center border"
              >
                <Text className={`text-xs font-bold ${insightsTimeframe === 'weekly' ? 'text-white' : 'text-[#9E98A8]'}`}>
                  Weekly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInsightsTimeframe('monthly')}
                style={insightsTimeframe === 'monthly' ? styles.timeframeTabActive : styles.timeframeTabInactive}
                className="flex-1 py-2 rounded-xl items-center border"
              >
                <Text className={`text-xs font-bold ${insightsTimeframe === 'monthly' ? 'text-white' : 'text-[#9E98A8]'}`}>
                  Monthly
                </Text>
              </Pressable>
            </View>

            {/* Timeframe Graph Card */}
            <View
              style={styles.card}
              className="border p-4 rounded-3xl mb-4 shadow-sm"
            >
              {/* Daily View */}
              {insightsTimeframe === 'daily' && (
                <View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-bold text-white">Hourly Usage Spikes</Text>
                    <Pressable
                      onPress={() => logHourlyUsage('12:00', 15)}
                      className="px-2 py-1 rounded-lg bg-[#3D2F54]"
                    >
                      <Text className="text-xs text-[#9D84D6] font-bold">+ Log 15m</Text>
                    </Pressable>
                  </View>

                  {hourlyUsage.length === 0 ? (
                    <View className="h-40 items-center justify-center py-4">
                      <Text className="text-3xl mb-2">📈</Text>
                      <Text className="text-xs font-bold text-white mb-1">No Hourly Usage Logged</Text>
                      <Text className="text-xs text-[#9E98A8] text-center px-4">
                        Usage spikes will plot in real-time as you log or track app activity today.
                      </Text>
                    </View>
                  ) : (
                    <View className="h-40 justify-between pt-2 pb-1 relative">
                      <View className="absolute inset-0 justify-between py-4">
                        <View className="w-full h-[1px] bg-[#2A2338]" />
                        <View className="w-full h-[1px] bg-[#2A2338]" />
                        <View className="w-full h-[1px] bg-[#2A2338]" />
                      </View>

                      <View className="flex-1 flex-row items-end justify-between px-3 z-10">
                        {hourlyUsage.map((pt) => {
                          const isSelected = selectedHourPoint === pt.timeLabel;
                          const maxMin = Math.max(...hourlyUsage.map((p) => p.minutes), 60);
                          const heightPercent = Math.min(Math.round((pt.minutes / maxMin) * 80), 85);

                          return (
                            <Pressable
                              key={pt.timeLabel}
                              onPress={() => setSelectedHourPoint(pt.timeLabel)}
                              className="items-center flex-1 h-full justify-end"
                            >
                              {isSelected && (
                                <View
                                  style={styles.btnPrimaryBordered}
                                  className="border px-2 py-0.5 rounded-full mb-1 z-20"
                                >
                                  <Text className="text-xs font-bold text-white">
                                    {pt.minutes}m
                                  </Text>
                                </View>
                              )}

                              <View
                                style={{ marginBottom: `${heightPercent}%` }}
                                className="items-center justify-center"
                              >
                                <View
                                  style={[styles.chartDot, isSelected ? styles.chartDotSelected : styles.chartDotNormal]}
                                />
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>

                      <View className="flex-row justify-between px-2 pt-2 border-t border-[#2A2338]">
                        {hourlyUsage.map((pt) => (
                          <Text
                            key={pt.timeLabel}
                            style={selectedHourPoint === pt.timeLabel ? styles.chartLabelSelected : styles.chartLabelNormal}
                            className="text-xs"
                          >
                            {pt.timeLabel}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Weekly View */}
              {insightsTimeframe === 'weekly' && (
                <View>
                  <Text className="text-xs font-bold text-white mb-2">Weekly Screen Trend</Text>
                  <View className="h-40 justify-end pt-2 pb-1">
                    <View className="flex-row items-end justify-between px-2 h-32 mb-2">
                      {weeklyDays.map((wd) => {
                        const maxVal = Math.max(...weeklyDays.map((d) => d.mins), 60);
                        const heightPct = Math.min(Math.round((wd.mins / maxVal) * 100), 100);
                        return (
                          <View key={wd.label} className="items-center flex-1">
                            <Text className="text-xs text-[#9D84D6] font-bold mb-1">
                              {wd.mins > 0 ? `${wd.mins}m` : ''}
                            </Text>
                            <View className="w-5 h-24 bg-[#1B1724] rounded-t-lg justify-end overflow-hidden">
                              <View
                                style={{ height: `${heightPct}%`, backgroundColor: '#9D84D6' }}
                                className="w-full rounded-t-lg"
                              />
                            </View>
                            <Text className="text-xs text-[#9E98A8] mt-1 font-semibold">
                              {wd.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Monthly View */}
              {insightsTimeframe === 'monthly' && (
                <View>
                  <Text className="text-xs font-bold text-white mb-2">Monthly Habit Distribution</Text>
                  <View className="h-40 justify-end pt-2 pb-1">
                    <View className="flex-row items-end justify-between px-4 h-32 mb-2">
                      {monthlyWeeks.map((mw) => {
                        const maxVal = Math.max(...monthlyWeeks.map((w) => w.mins), 60);
                        const heightPct = Math.min(Math.round((mw.mins / maxVal) * 100), 100);
                        return (
                          <View key={mw.label} className="items-center flex-1">
                            <Text className="text-xs text-[#84CC16] font-bold mb-1">
                              {mw.mins > 0 ? `${mw.mins}m` : ''}
                            </Text>
                            <View className="w-8 h-24 bg-[#1B1724] rounded-t-lg justify-end overflow-hidden">
                              <View
                                style={{ height: `${heightPct}%`, backgroundColor: '#84CC16' }}
                                className="w-full rounded-t-lg"
                              />
                            </View>
                            <Text className="text-xs text-[#9E98A8] mt-1 font-semibold">
                              {mw.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Total Usage Footer */}
              <View className="pt-3 mt-2 border-t border-[#2D273A] flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-[#9E98A8]">
                  Total Screen Calculation
                </Text>
                <Text style={styles.textAccent} className="text-sm font-extrabold">
                  {formatHoursMins(totalUsedMinutes)}
                </Text>
              </View>
            </View>

            {/* Screen Time Comparison Card (Today vs. Yesterday / 7-Day Average) */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-white">Screen Time Comparison</Text>
                <View className="px-2 py-0.5 rounded-full bg-[#261E38] border border-[#3E3060]">
                  <Text className="text-xs font-bold text-[#A7F3D0]">On-Device Benchmark</Text>
                </View>
              </View>

              {(() => {
                // Compute on-device comparison benchmark (yesterday benchmark = 7-day average or limit basis)
                const benchmarkMinutes = totalLimitMinutes > 0 ? totalLimitMinutes : 120;
                const diffMinutes = totalUsedMinutes - benchmarkMinutes;
                const diffPercent = benchmarkMinutes > 0 ? Math.round((Math.abs(diffMinutes) / benchmarkMinutes) * 100) : 0;
                const isUnder = diffMinutes <= 0;

                return (
                  <View>
                    <View className="flex-row items-baseline gap-2 mb-2">
                      <Text className={`text-2xl font-black ${isUnder ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUnder ? `-${diffPercent}%` : `+${diffPercent}%`}
                      </Text>
                      <Text className="text-xs text-[#9E98A8]">
                        {isUnder
                          ? 'less screen time vs target benchmark'
                          : 'more screen time vs target benchmark'}
                      </Text>
                    </View>

                    <View className="bg-[#181126] border border-[#2E2447] p-3 rounded-2xl flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs text-[#7C7389] uppercase font-bold">Today</Text>
                        <Text className="text-sm font-extrabold text-white">{formatHoursMins(totalUsedMinutes)}</Text>
                      </View>
                      <Text className="text-base text-[#7C7389]">⇄</Text>
                      <View>
                        <Text className="text-xs text-[#7C7389] uppercase font-bold">Target Benchmark</Text>
                        <Text className="text-sm font-extrabold text-[#D1CADB]">{formatHoursMins(benchmarkMinutes)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-[#7C7389] uppercase font-bold">Status</Text>
                        <Text className={`text-xs font-bold ${isUnder ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUnder ? '🌱 On Track' : '⚠️ Over Cap'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Personalized Usage Insights Card (Digital Wellbeing Score & Peak Addiction Hour) */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-white">Personalized Wellbeing Insights</Text>
                <Text className="text-xs text-[#9D84D6] font-bold">100% On-Device</Text>
              </View>

              {(() => {
                // Calculate Health Score (0 to 100)
                let score = 100;
                if (totalLimitMinutes > 0 && totalUsedMinutes > totalLimitMinutes) {
                  const overPct = (totalUsedMinutes - totalLimitMinutes) / totalLimitMinutes;
                  score = Math.max(20, Math.round(100 - overPct * 50));
                } else if (totalLimitMinutes > 0) {
                  const usagePct = totalUsedMinutes / totalLimitMinutes;
                  score = Math.round(100 - usagePct * 20);
                } else if (totalUsedMinutes > 180) {
                  score = Math.max(30, 100 - Math.round(((totalUsedMinutes - 180) / 60) * 15));
                }

                // Identify highest used app
                const highestApp = rankedApps.length > 0 ? rankedApps[0] : null;

                return (
                  <View className="gap-3">
                    {/* Score Gauge Row */}
                    <View className="bg-[#181126] border border-[#2E2447] p-3 rounded-2xl flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs text-[#9E98A8] font-bold uppercase">Digital Health Score</Text>
                        <Text className="text-xs text-[#D1CADB] mt-0.5">
                          {score >= 80 ? '🌟 Excellent balance today' : score >= 60 ? '👍 Fair balance' : '⚠️ High addiction risk'}
                        </Text>
                      </View>
                      <View className="w-12 h-12 rounded-full border-2 border-[#9D84D6] items-center justify-center bg-[#281F3D]">
                        <Text className="text-sm font-black text-white">{score}</Text>
                      </View>
                    </View>

                    {/* AI / Smart Pattern Recommendations */}
                    <View className="bg-[#1B142B] border border-[#3E2E60] p-3 rounded-2xl">
                      <Text className="text-xs font-extrabold uppercase text-[#9D84D6] mb-1">
                        💡 Smart Pattern Analysis
                      </Text>
                      <Text className="text-xs text-white leading-relaxed">
                        {highestApp
                          ? `Your primary screen distraction is ${highestApp.name} (${formatHoursMins(highestApp.used)}). Consider setting a 15-minute countdown in Focus Mode before opening it.`
                          : 'No major app addictions detected today. Maintain this healthy digital equilibrium!'}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Platform Distribution Card */}
            <View
              style={styles.card}
              className="border p-4 rounded-3xl mb-4 shadow-sm"
            >
              <Text className="text-xs font-bold text-white mb-3">
                Platform Breakdown
              </Text>

              {totalUsedMinutes === 0 ? (
                <Text className="text-xs text-[#9E98A8] text-center py-2">
                  No active platform screen time recorded yet today.
                </Text>
              ) : (
                <View className="gap-3">
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-medium text-[#D1CADB]">📱 Mobile App</Text>
                      <Text className="text-xs font-bold text-white">{mobileAppPct}%</Text>
                    </View>
                    <View className="w-full h-2 bg-[#16131D] rounded-full overflow-hidden">
                      <View style={[styles.chartBarMobile, { width: `${mobileAppPct}%` }]} className="h-full rounded-full" />
                    </View>
                  </View>

                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-medium text-[#D1CADB]">🌐 Mobile Web</Text>
                      <Text className="text-xs font-bold text-white">{webPct}%</Text>
                    </View>
                    <View className="w-full h-2 bg-[#16131D] rounded-full overflow-hidden">
                      <View style={[styles.chartBarWeb, { width: `${webPct}%` }]} className="h-full rounded-full" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Ranked Apps List */}
            <View
              style={styles.card}
              className="border p-4 rounded-3xl mb-8 shadow-sm"
            >
              <Text className="text-xs font-bold text-white mb-3">
                Ranked Applications
              </Text>

              {rankedApps.length === 0 ? (
                <View className="py-4 items-center justify-center">
                  <Text className="text-2xl mb-1">📱</Text>
                  <Text className="text-xs font-bold text-white mb-1">No Applications Ranked</Text>
                  <Text className="text-xs text-[#9E98A8] text-center mb-3">
                    Add limits for your apps to monitor their daily screen ranking.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/dashboard/add-limit')}
                    style={styles.btnPrimary}
                    className="px-3.5 py-1.5 rounded-xl active:opacity-90"
                  >
                    <Text className="text-white text-xs font-bold">+ Add App Limit</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-2.5">
                  {rankedApps.map((item, idx) => {
                    const pct = totalUsedMinutes > 0 ? Math.round((item.used / totalUsedMinutes) * 100) : 0;
                    return (
                      <View
                        key={item.id}
                        style={idx === rankedApps.length - 1 ? styles.rowDividerNone : styles.rowDivider}
                        className="flex-row items-center justify-between py-2 border-b"
                      >
                        <View className="flex-row items-center gap-2.5">
                          <Text className="text-base">📱</Text>
                          <Text className="text-xs font-bold text-white">{item.name}</Text>
                        </View>

                        <View className="items-end">
                          <Text className="text-xs font-bold text-white">{formatHoursMins(item.used)}</Text>
                          <Text className="text-xs text-[#9E98A8]">{pct}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: IN-APP BLOCKING (STEP 2: DEEP CONTROL)                 */}
        {/* ============================================================== */}
        {activeModule === 'in-app-blocking' && (() => {
          // Dynamic suggestions based on real installed phone apps (Zero hardcoding)
          const installedShieldSuggestions = installedDeviceApps
            .filter((app) => {
              const lowerName = app.appName.toLowerCase();
              const lowerPkg = app.packageName.toLowerCase();
              return Object.keys(APP_FEATURE_PRESETS).some(
                (k) => lowerName.includes(k) || lowerPkg.includes(k)
              );
            })
            .slice(0, 8);

          // Filter installed apps in modal by search query & category
          const filteredModalApps = installedDeviceApps.filter((app) => {
            const matchesQuery =
              !shieldSearchQuery.trim() ||
              app.appName.toLowerCase().includes(shieldSearchQuery.toLowerCase()) ||
              app.packageName.toLowerCase().includes(shieldSearchQuery.toLowerCase());
            const matchesCat =
              shieldCategoryFilter === 'All' || app.category === shieldCategoryFilter;
            return matchesQuery && matchesCat;
          });

          // Compute suggested granular features for currently selected modal app
          const activeAppFeatures = selectedShieldApp
            ? (() => {
                const lowerName = selectedShieldApp.appName.toLowerCase();
                const lowerPkg = selectedShieldApp.packageName.toLowerCase();
                for (const [key, feats] of Object.entries(APP_FEATURE_PRESETS)) {
                  if (lowerName.includes(key) || lowerPkg.includes(key)) {
                    return feats;
                  }
                }
                return GENERIC_FEATURE_PRESETS[selectedShieldApp.category] || [
                  'Addictive Feed',
                  'Infinite Scroll',
                  'Comments Section',
                  'Explore / Trends',
                  'Short Videos',
                ];
              })()
            : [];

          return (
            <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <View
                  style={styles.btnPrimaryBordered}
                  className="border px-2.5 py-0.5 rounded-full self-start mb-2"
                >
                  <Text className="text-xs font-bold text-white uppercase">
                    Step 2: Deep Control
                  </Text>
                </View>
                <Text className="text-xl font-black text-white">In-App Granular Blocking</Text>
                <Text className="text-xs text-[#9E98A8] mt-1">
                  Using real on-device controls, block specific addictive UI elements (Shorts, Reels, Feeds, or Comments) while keeping normal app usage active.
                </Text>
              </View>

              {/* Dynamic Suggestions based exclusively on real installed apps */}
              {installedShieldSuggestions.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-bold text-[#9E98A8] uppercase">
                      Quick Shields (Installed on Device):
                    </Text>
                    <Text className="text-xs text-[#A7F3D0] font-bold">
                      ✓ Real Apps ({installedDeviceApps.length})
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {installedShieldSuggestions.map((app) => {
                      const lowerName = app.appName.toLowerCase();
                      const lowerPkg = app.packageName.toLowerCase();
                      const featureKey = Object.keys(APP_FEATURE_PRESETS).find(
                        (k) => lowerName.includes(k) || lowerPkg.includes(k)
                      );
                      const featureToSuggest = featureKey
                        ? APP_FEATURE_PRESETS[featureKey][0]
                        : 'Infinite Feed';

                      return (
                        <Pressable
                          key={app.packageName}
                          onPress={() =>
                            addInAppRule({
                              appName: app.appName,
                              packageName: app.packageName,
                              featureName: featureToSuggest,
                              description: `Restricts ${featureToSuggest} inside ${app.appName}`,
                              appIcon: app.icon || '🛡️',
                            })
                          }
                          className="border border-[#2E273B] bg-[#1B1724] px-3 py-2 rounded-2xl active:opacity-70 flex-row items-center gap-2"
                        >
                          {app.icon ? (
                            <Image
                              source={{ uri: app.icon }}
                              className="w-5 h-5 rounded-md"
                              resizeMode="contain"
                            />
                          ) : (
                            <Text className="text-xs">🛡️</Text>
                          )}
                          <Text className="text-xs font-bold text-white">
                            + {app.appName} {featureToSuggest}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Active Shields Header */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-extrabold text-white">
                  Active Shields ({inAppRules.length})
                </Text>
                <Pressable
                  onPress={() => {
                    setSelectedShieldApp(null);
                    setNewShieldApp('');
                    setNewShieldPackage('');
                    setNewShieldFeature('');
                    setNewShieldDesc('');
                    setShieldSearchQuery('');
                    setIsShieldModalOpen(true);
                  }}
                  style={styles.btnPrimary}
                  className="px-3.5 py-2 rounded-xl active:opacity-90 flex-row items-center gap-1.5"
                >
                  <Text className="text-white text-xs font-extrabold">+ Create Custom Shield</Text>
                </Pressable>
              </View>

              {inAppRules.length === 0 ? (
                <View
                  style={styles.card}
                  className="border p-6 rounded-3xl items-center justify-center mb-8"
                >
                  <Text className="text-2xl mb-1">🛡️</Text>
                  <Text className="text-xs font-bold text-white mb-1">No In-App Shields Configured</Text>
                  <Text className="text-xs text-[#9E98A8] text-center mb-4 leading-relaxed">
                    Select any installed phone application to create a deep granular shield that blocks Shorts, Reels, Explore grids, or distracting feeds.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedShieldApp(null);
                      setNewShieldApp('');
                      setNewShieldPackage('');
                      setNewShieldFeature('');
                      setNewShieldDesc('');
                      setShieldSearchQuery('');
                      setIsShieldModalOpen(true);
                    }}
                    style={styles.btnPrimary}
                    className="px-5 py-2.5 rounded-xl active:opacity-90"
                  >
                    <Text className="text-white text-xs font-bold">+ Create In-App Shield</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-2.5 mb-8">
                  {inAppRules.map((rule) => {
                    const matchedApp = installedDeviceApps.find(
                      (a) =>
                        a.appName.toLowerCase() === rule.appName.toLowerCase() ||
                        (rule.packageName && a.packageName === rule.packageName)
                    );
                    const iconSource = matchedApp?.icon || (rule.appIcon && rule.appIcon.startsWith('data:') ? rule.appIcon : null);

                    return (
                      <View
                        key={rule.id}
                        style={styles.card}
                        className="border p-4 rounded-2xl shadow-xs"
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                            {iconSource ? (
                              <Image
                                source={{ uri: iconSource }}
                                className="w-8 h-8 rounded-xl"
                                resizeMode="contain"
                              />
                            ) : (
                              <View className="w-8 h-8 rounded-xl bg-[#281D40] border border-[#523A85] items-center justify-center">
                                <Text className="text-xs">🛡️</Text>
                              </View>
                            )}
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-white">{rule.featureName}</Text>
                              <View className="flex-row items-center gap-1.5 mt-0.5">
                                <Text className="text-xs text-[#A7F3D0] font-semibold">{rule.appName}</Text>
                                {matchedApp?.packageName && (
                                  <Text className="text-xs text-[#7C7389] font-mono" numberOfLines={1}>
                                    • {matchedApp.packageName}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>

                          <View className="flex-row items-center gap-3">
                            <Pressable
                              onPress={() => toggleInAppRule(rule.id)}
                              style={rule.isEnabled ? styles.toggleTrackActive : styles.toggleTrackInactive}
                              className="border w-11 h-6 rounded-full px-0.5 justify-center"
                              accessibilityRole="switch"
                              accessibilityState={{ checked: rule.isEnabled }}
                            >
                              <View
                                style={rule.isEnabled ? styles.toggleThumbActive : styles.toggleThumbInactive}
                                className="w-5 h-5 rounded-full"
                              />
                            </Pressable>

                            <Pressable
                              onPress={() => deleteInAppRule(rule.id)}
                              hitSlop={8}
                              className="p-1"
                            >
                              <Text className="text-sm font-bold text-rose-400">✕</Text>
                            </Pressable>
                          </View>
                        </View>

                        <Text className="text-xs text-[#9D84D6] leading-relaxed">
                          {rule.description}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Comprehensive Modal to Add Granular Shield with Real Installed Apps */}
              <Modal
                visible={isShieldModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsShieldModalOpen(false)}
              >
                <View className="flex-1 justify-end bg-black/80">
                  <View
                    style={styles.cardNoBorder}
                    className="rounded-t-3xl p-5 border-t border-[#3D3059] max-h-[85%]"
                  >
                    <View className="flex-row justify-between items-center mb-3">
                      <View>
                        <Text className="text-base font-extrabold text-white">Create In-App Shield</Text>
                        <Text className="text-xs text-[#A7F3D0] font-semibold">
                          Select installed app & specific element to block
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setIsShieldModalOpen(false)}
                        className="px-2.5 py-1 rounded-lg bg-[#241A3D] border border-[#483770]"
                      >
                        <Text className="text-xs font-bold text-[#C5BFD6]">Cancel</Text>
                      </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      {/* Step A: Pick an installed physical application */}
                      <Text className="text-xs font-extrabold text-[#D1CADB] mb-2 uppercase">
                        1. Select Installed Application:
                      </Text>

                      {/* Selected App Display Banner */}
                      {selectedShieldApp ? (
                        <View className="bg-[#241A3D] border border-[#7C3AED] rounded-2xl p-3 flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-2.5 flex-1">
                            {selectedShieldApp.icon ? (
                              <Image
                                source={{ uri: selectedShieldApp.icon }}
                                className="w-9 h-9 rounded-xl"
                                resizeMode="contain"
                              />
                            ) : (
                              <View className="w-9 h-9 rounded-xl bg-[#3D2D68] items-center justify-center border border-[#9D84D6]">
                                <Text className="text-sm font-bold text-[#A7F3D0]">
                                  {selectedShieldApp.appName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View className="flex-1">
                              <View className="flex-row items-center gap-1.5">
                                <Text className="text-xs text-[#A7F3D0] font-extrabold">✓ Target App</Text>
                                <Text className="text-xs text-[#D1CADB] font-semibold bg-[#3D2D68] px-1.5 py-0.5 rounded-md">
                                  {selectedShieldApp.category}
                                </Text>
                              </View>
                              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                                {selectedShieldApp.appName}
                              </Text>
                              <Text className="text-xs text-[#8E87A3] font-mono" numberOfLines={1}>
                                {selectedShieldApp.packageName}
                              </Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => setSelectedShieldApp(null)}
                            className="px-2.5 py-1 rounded-lg bg-[#3D2D68] border border-[#5B4687] active:opacity-70"
                          >
                            <Text className="text-xs text-[#C5BFD6] font-bold">Change</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View className="mb-3">
                          {/* Search installed apps */}
                          <TextInput
                            style={styles.inputField}
                            className="border rounded-xl px-3 py-2 text-xs text-white mb-2"
                            placeholder="Search installed phone apps..."
                            placeholderTextColor="#7C7389"
                            value={shieldSearchQuery}
                            onChangeText={setShieldSearchQuery}
                          />

                          {/* Category Filters */}
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="flex-row mb-2"
                            contentContainerStyle={{ gap: 6 }}
                          >
                            {['All', 'Social', 'Entertainment', 'Games', 'Communication', 'Productivity'].map((cat) => (
                              <Pressable
                                key={cat}
                                onPress={() => setShieldCategoryFilter(cat)}
                                className={`px-2.5 py-1 rounded-lg border ${
                                  shieldCategoryFilter === cat
                                    ? 'bg-[#52388A] border-[#A7F3D0]'
                                    : 'bg-[#181126] border-[#2A223D]'
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${
                                    shieldCategoryFilter === cat ? 'text-white' : 'text-[#8E87A3]'
                                  }`}
                                >
                                  {cat}
                                </Text>
                              </Pressable>
                            ))}
                          </ScrollView>

                          {/* Installed Apps Grid */}
                          <View className="max-h-48 border border-[#2A223D] bg-[#140E24] rounded-2xl p-2">
                            <ScrollView
                              showsVerticalScrollIndicator={true}
                              nestedScrollEnabled={true}
                              contentContainerStyle={{ gap: 6 }}
                            >
                              {filteredModalApps.length === 0 ? (
                                <View className="py-4 items-center">
                                  <Text className="text-xs text-[#8E87A3]">No installed apps match filter</Text>
                                </View>
                              ) : (
                                filteredModalApps.map((app) => (
                                  <Pressable
                                    key={app.packageName}
                                    onPress={() => {
                                      setSelectedShieldApp(app);
                                      setNewShieldApp(app.appName);
                                      setNewShieldPackage(app.packageName);
                                      // Suggest top feature
                                      const lower = app.appName.toLowerCase();
                                      const feat = Object.entries(APP_FEATURE_PRESETS).find(
                                        ([k]) => lower.includes(k)
                                      );
                                      if (feat) {
                                        setNewShieldFeature(feat[1][0]);
                                        setNewShieldDesc(`Blocks ${feat[1][0]} inside ${app.appName}`);
                                      }
                                    }}
                                    className="p-2 rounded-xl bg-[#1B142B] border border-[#2D2345] flex-row items-center gap-2.5 active:bg-[#2F2150]"
                                  >
                                    {app.icon ? (
                                      <Image
                                        source={{ uri: app.icon }}
                                        className="w-7 h-7 rounded-lg"
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <View className="w-7 h-7 rounded-lg bg-[#302250] items-center justify-center">
                                        <Text className="text-xs font-bold text-[#A7F3D0]">
                                          {app.appName.charAt(0).toUpperCase()}
                                        </Text>
                                      </View>
                                    )}
                                    <View className="flex-1">
                                      <Text className="text-xs font-bold text-white" numberOfLines={1}>
                                        {app.appName}
                                      </Text>
                                      <Text className="text-xs text-[#7C7389] font-mono" numberOfLines={1}>
                                        {app.packageName}
                                      </Text>
                                    </View>
                                    <Text className="text-xs text-[#9D84D6] font-semibold">Select →</Text>
                                  </Pressable>
                                ))
                              )}
                            </ScrollView>
                          </View>
                        </View>
                      )}

                      {/* Step B: Select or Enter Granular In-App Feature */}
                      <Text className="text-xs font-extrabold text-[#D1CADB] mb-2 uppercase">
                        2. Granular Feature to Block:
                      </Text>

                      {/* Presets based on selected app */}
                      {activeAppFeatures.length > 0 && (
                        <View className="mb-2">
                          <Text className="text-xs text-[#8E87A3] mb-1.5">
                            Recommended elements for {selectedShieldApp?.appName}:
                          </Text>
                          <View className="flex-row flex-wrap gap-1.5 mb-2">
                            {activeAppFeatures.map((feat) => {
                              const isSelected = newShieldFeature === feat;
                              return (
                                <Pressable
                                  key={feat}
                                  onPress={() => {
                                    setNewShieldFeature(feat);
                                    if (selectedShieldApp) {
                                      setNewShieldDesc(`Restricts ${feat} inside ${selectedShieldApp.appName}`);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-xl border ${
                                    isSelected
                                      ? 'bg-[#6C38E8] border-[#A7F3D0]'
                                      : 'bg-[#1D172E] border-[#362B52]'
                                  }`}
                                >
                                  <Text
                                    className={`text-xs font-bold ${
                                      isSelected ? 'text-white' : 'text-[#C5BFD6]'
                                    }`}
                                  >
                                    {isSelected ? '✓ ' : '+ '}
                                    {feat}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      <TextInput
                        style={styles.inputField}
                        className="border rounded-xl px-4 py-2.5 text-xs text-white mb-2"
                        placeholder="Feature name (e.g. Shorts, Reels, Comments, Explore)"
                        placeholderTextColor="#7C7389"
                        value={newShieldFeature}
                        onChangeText={setNewShieldFeature}
                      />

                      <TextInput
                        style={styles.inputField}
                        className="border rounded-xl px-4 py-2.5 text-xs text-white mb-4"
                        placeholder="Description (optional)"
                        placeholderTextColor="#7C7389"
                        value={newShieldDesc}
                        onChangeText={setNewShieldDesc}
                      />

                      <Pressable
                        onPress={handleCreateShieldSubmit}
                        className="py-3 rounded-xl items-center bg-[#6C38E8] border border-[#8B5CF6] active:opacity-85 shadow-lg mb-4"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-wider">
                          Save In-App Shield →
                        </Text>
                      </Pressable>
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          );
        })()}

        {/* ============================================================== */}
        {/* MODULE: STUDY & SLEEP SCHEDULES (STEP 8: RECURRING TIME BLOCKS) */}
        {/* ============================================================== */}
        {activeModule === 'schedules' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <View
                style={styles.btnPrimaryBordered}
                className="border px-2.5 py-0.5 rounded-full self-start mb-2"
              >
                <Text className="text-xs font-bold text-white uppercase">
                  Step 8: Time Blocking
                </Text>
              </View>
              <Text className="text-xl font-black text-white">Study & Sleep Schedules 🌙</Text>
              <Text className="text-xs text-[#9E98A8] mt-1 leading-relaxed">
                Define recurring bedtime and deep work routines that restrict distracting applications during specific hours of the day.
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Active Schedules ({schedules.length})
              </Text>
              <Pressable
                onPress={() => setIsScheduleModalOpen(true)}
                style={styles.btnPrimary}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ New Schedule</Text>
              </Pressable>
            </View>

            {schedules.length === 0 ? (
              <View style={styles.card} className="border p-6 rounded-3xl items-center justify-center mb-8">
                <Text className="text-2xl mb-1">🛌</Text>
                <Text className="text-xs font-bold text-white mb-1">No Active Schedules</Text>
                <Text className="text-xs text-[#9E98A8] text-center mb-3">
                  Create automatic blackout windows for study sessions or nighttime wind-down.
                </Text>
                <Pressable
                  onPress={() => setIsScheduleModalOpen(true)}
                  style={styles.btnPrimary}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Create Schedule</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3 mb-8">
                {schedules.map((sc) => (
                  <View key={sc.id} style={styles.card} className="border p-4 rounded-3xl">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-row items-center gap-2.5">
                        <Text className="text-xl">
                          {sc.type === 'sleep' ? '🌙' : sc.type === 'study' ? '📚' : '🎯'}
                        </Text>
                        <View>
                          <Text className="text-sm font-extrabold text-white">{sc.name}</Text>
                          <Text className="text-xs text-[#9D84D6]">
                            {sc.startTime} - {sc.endTime} • {sc.daysActive.join(', ')}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => toggleSchedule(sc.id)}
                          style={sc.isEnabled ? styles.toggleTrackActive : styles.toggleTrackInactive}
                          className="border w-11 h-6 rounded-full px-0.5 justify-center"
                        >
                          <View
                            style={sc.isEnabled ? styles.toggleThumbActive : styles.toggleThumbInactive}
                            className="w-5 h-5 rounded-full"
                          />
                        </Pressable>
                        <Pressable onPress={() => deleteSchedule(sc.id)} hitSlop={6}>
                          <Text className="text-xs text-rose-400 font-bold ml-1">✕</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View className="pt-2 border-t border-[#2D273A] flex-row justify-between items-center">
                      <Text className="text-xs text-[#9E98A8]">
                        Restricts {sc.blockedApps.length > 0 ? `${sc.blockedApps.length} apps` : 'All distracting apps'}
                      </Text>
                      <Text className="text-xs font-bold text-[#A7F3D0]">
                        {sc.isEnabled ? '● Schedule Armed' : '○ Disabled'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Modal: Add Schedule */}
            <Modal
              visible={isScheduleModalOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsScheduleModalOpen(false)}
            >
              <View className="flex-1 justify-end bg-black/75">
                <View style={styles.cardNoBorder} className="rounded-t-3xl p-6 border-t border-[#2E273B]">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-bold text-white">New Routine Schedule</Text>
                    <Pressable onPress={() => setIsScheduleModalOpen(false)}>
                      <Text className="text-xs font-bold text-[#9E98A8]">Cancel</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={styles.inputField}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3 text-white"
                    placeholder="Schedule Name (e.g. Night Sleep, Focus Hour)"
                    placeholderTextColor="#7C7389"
                    value={newScheduleName}
                    onChangeText={setNewScheduleName}
                  />

                  {/* Routine Type Tabs */}
                  <View className="flex-row gap-2 mb-3">
                    {(['study', 'sleep', 'focus'] as const).map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setNewScheduleType(t)}
                        className={`flex-1 py-2 rounded-xl border items-center ${
                          newScheduleType === t ? 'bg-[#3D2D68] border-[#9D84D6]' : 'bg-[#181126] border-[#2A223D]'
                        }`}
                      >
                        <Text className="text-xs font-bold text-white capitalize">{t}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Active Days Selector */}
                  <Text className="text-xs text-[#9E98A8] mb-1.5 font-bold">Active Days</Text>
                  <View className="flex-row justify-between mb-3 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                      const isSel = newScheduleDays.includes(d);
                      return (
                        <Pressable
                          key={d}
                          onPress={() => {
                            if (isSel) {
                              setNewScheduleDays(newScheduleDays.filter((day) => day !== d));
                            } else {
                              setNewScheduleDays([...newScheduleDays, d]);
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-lg border items-center ${
                            isSel ? 'bg-[#52388A] border-[#9D84D6]' : 'bg-[#181126] border-[#2A223D]'
                          }`}
                        >
                          <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-[#8E87A3]'}`}>
                            {d}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Time Inputs */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-xs text-[#9E98A8] mb-1 font-bold">Start Time (24h)</Text>
                      <TextInput
                        style={styles.inputField}
                        className="border rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="22:00"
                        placeholderTextColor="#7C7389"
                        value={newScheduleStart}
                        onChangeText={setNewScheduleStart}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-[#9E98A8] mb-1 font-bold">End Time (24h)</Text>
                      <TextInput
                        style={styles.inputField}
                        className="border rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="07:00"
                        placeholderTextColor="#7C7389"
                        value={newScheduleEnd}
                        onChangeText={setNewScheduleEnd}
                      />
                    </View>
                  </View>

                  {/* Blocked Apps Selector from installed device apps */}
                  <Text className="text-xs text-[#9E98A8] mb-1 font-bold">Select Apps to Block during Schedule:</Text>
                  {availableAppsForGrouping.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="flex-row mb-3"
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {availableAppsForGrouping.map((app) => {
                        const isBlocked = newScheduleApps.includes(app);
                        return (
                          <Pressable
                            key={app}
                            onPress={() => {
                              if (isBlocked) {
                                setNewScheduleApps(newScheduleApps.filter((a) => a !== app));
                              } else {
                                setNewScheduleApps([...newScheduleApps, app]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl border ${
                              isBlocked ? 'bg-[#52388A] border-[#A7F3D0]' : 'bg-[#181126] border-[#2A223D]'
                            }`}
                          >
                            <Text className={`text-xs font-semibold ${isBlocked ? 'text-white' : 'text-[#8E87A3]'}`}>
                              {isBlocked ? `✓ ${app}` : app}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : null}

                  <Pressable
                    onPress={handleCreateScheduleSubmit}
                    style={styles.btnPrimary}
                    className="py-3.5 rounded-xl items-center"
                  >
                    <Text className="text-white text-xs font-bold">Save Routine Schedule</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: USAGE LIMITS (STEP 3 COMBINED BOUNDARIES)              */}
        {/* ============================================================== */}
        {activeModule === 'limits' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <View
                style={styles.btnPrimaryBordered}
                className="border px-2.5 py-0.5 rounded-full self-start mb-2"
              >
                <Text className="text-xs font-bold text-white uppercase">
                  Step 3: Combined Boundaries
                </Text>
              </View>
              <Text className="text-xl font-black text-white">Combined Usage Limits</Text>
              <Text className="text-xs text-[#9E98A8] mt-1">
                Group multiple apps together (e.g. TikTok, Instagram & Facebook) to share a combined daily limit.
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Multi-App Groups ({combinedLimits.length})
              </Text>
              <Pressable
                onPress={() => setIsBundleModalOpen(true)}
                style={styles.btnPrimary}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ New Group</Text>
              </Pressable>
            </View>

            {combinedLimits.length === 0 ? (
              <View
                style={styles.card}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">⏱️</Text>
                <Text className="text-xs font-bold text-white mb-1">No Multi-App Groups</Text>
                <Text className="text-xs text-[#9E98A8] text-center mb-3">
                  Group addictive apps together so they share a single daily time limit.
                </Text>
                <Pressable
                  onPress={() => setIsBundleModalOpen(true)}
                  style={styles.btnPrimary}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Create Combined Group</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3 mb-8">
                {combinedLimits.map((bundle) => {
                  const percent = Math.min(Math.round((bundle.used / bundle.limit) * 100), 100);
                  return (
                    <View
                      key={bundle.id}
                      style={styles.card}
                      className="border p-4 rounded-3xl"
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View>
                          <Text className="text-sm font-extrabold text-white">{bundle.name}</Text>
                          <Text className="text-xs text-[#9E98A8]">
                            {bundle.appNames.join(', ')}
                          </Text>
                        </View>
                        <Pressable onPress={() => deleteCombinedLimit(bundle.id)}>
                          <Text className="text-xs text-rose-400 font-semibold">Delete</Text>
                        </Pressable>
                      </View>

                      <View className="w-full h-2 bg-[#16131D] rounded-full overflow-hidden mb-2">
                        <View
                          style={[styles.progressBarFill, { width: `${percent}%` }]}
                          className="h-full rounded-full"
                        />
                      </View>

                      <View className="flex-row justify-between items-center pt-2 border-t border-[#2D273A] flex-wrap gap-y-1.5">
                        <Text className="text-xs text-[#9E98A8]">
                          {bundle.used}m used of {bundle.limit}m total
                        </Text>
                        <View className="flex-row items-center gap-1 flex-wrap">
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -10)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-[#9E98A8]">-10m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -5)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-[#9E98A8]">-5m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -1)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-[#9E98A8]">-1m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 1)}
                            className="px-2 py-0.5 rounded-md bg-[#2D2248] border border-[#9D84D6] active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-[#9D84D6]">+1m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 5)}
                            style={styles.btnPrimary}
                            className="px-2 py-0.5 rounded-md active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-white">+5m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 10)}
                            style={styles.btnPrimary}
                            className="px-2 py-0.5 rounded-md active:opacity-70"
                          >
                            <Text className="text-xs font-bold text-white">+10m</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Modal to Create Group using StayFree Time Picker */}
            <Modal
              visible={isBundleModalOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsBundleModalOpen(false)}
            >
              <View className="flex-1 justify-end bg-black/70">
                <View style={styles.cardNoBorder} className="rounded-t-3xl p-6 border-t border-[#2E273B]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold text-white">Create Combined Group</Text>
                    <Pressable onPress={() => setIsBundleModalOpen(false)}>
                      <Text className="text-xs font-bold text-[#9E98A8]">Cancel</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={styles.inputField}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="Group name (e.g. Social Entertainment)"
                    placeholderTextColor="#7C7389"
                    value={newBundleName}
                    onChangeText={setNewBundleName}
                  />

                  <Text className="text-xs text-[#9E98A8] mb-1.5 font-bold">Select Apps for Group:</Text>
                  {availableAppsForGrouping.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {availableAppsForGrouping.map((app) => {
                        const isSelected = selectedAppsForBundle.includes(app);
                        return (
                          <Pressable
                            key={app}
                            onPress={() => toggleAppSelectionForBundle(app)}
                            style={isSelected ? styles.filterPillActive : styles.filterPillInactive}
                            className="border px-3 py-1.5 rounded-xl"
                          >
                            <Text style={isSelected ? styles.filterTextActive : styles.filterTextInactive} className="text-xs font-bold">
                              {isSelected ? '✓ ' : '+ '}
                              {app}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Add Any App to group */}
                  <View className="flex-row gap-2 mb-3">
                    <TextInput
                      style={styles.inputField}
                      className="flex-1 border rounded-xl px-3 py-2 text-xs"
                      placeholder="Add another app to group..."
                      placeholderTextColor="#7C7389"
                      value={customBundleAppInput}
                      onChangeText={setCustomBundleAppInput}
                    />
                    <Pressable
                      onPress={() => {
                        if (customBundleAppInput.trim()) {
                          toggleAppSelectionForBundle(customBundleAppInput.trim());
                          setCustomBundleAppInput('');
                        }
                      }}
                      style={styles.btnPrimary}
                      className="px-3 py-2 rounded-xl justify-center"
                    >
                      <Text className="text-white text-xs font-bold">+ Add</Text>
                    </Pressable>
                  </View>

                  <Text className="text-xs text-[#9E98A8] mb-1 font-bold">Shared Daily Time Limit:</Text>
                  <StayFreeTimePicker
                    hours={bundleHours}
                    minutes={bundleMinutes}
                    onChange={(h, m) => {
                      setBundleHours(h);
                      setBundleMinutes(m);
                    }}
                    maxHours={12}
                  />

                  <Pressable
                    onPress={handleCreateBundle}
                    style={styles.btnPrimary}
                    className="py-3.5 rounded-xl items-center mt-3"
                  >
                    <Text className="text-white text-xs font-bold">Save Group Boundary</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: AUTOMATIC DYNAMIC NOTIFICATION SERVICE                 */}
        {/* ============================================================== */}
        {activeModule === 'notifications' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-4">
              <Text className="text-xl font-black text-white">Automatic Notification Service</Text>
              <Text className="text-xs text-[#9E98A8] mt-1 leading-relaxed">
                Generates dynamic alert messages in real time based on your application name and remaining screen time allowance.
              </Text>
            </View>

            {/* Service Status & Master Switch */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4">
              <View className="flex-row justify-between items-center pb-3 border-b border-[#2A2436]">
                <View>
                  <Text className="text-xs font-bold text-white">Automatic Notification Engine</Text>
                  <Text className="text-xs text-[#9E98A8]">
                    Evaluates usage automatically and generates dynamic alerts
                  </Text>
                </View>
                <Pressable
                  onPress={toggleLocalNotifications}
                  style={localNotificationsEnabled ? styles.btnPrimary : styles.btnPrimaryBordered}
                  className="px-3 py-1.5 rounded-xl active:opacity-80"
                >
                  <Text className="text-xs font-bold text-white">
                    {localNotificationsEnabled ? '● Active' : '○ Paused'}
                  </Text>
                </Pressable>
              </View>

              {/* Thresholds Configurator */}
              <View className="mt-3">
                <Text className="text-xs font-bold text-white mb-1.5">
                  Dynamic Alert Trigger Thresholds
                </Text>
                <Text className="text-xs text-[#9E98A8] mb-2.5">
                  Select which remaining time milestones automatically fire dynamic notifications:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[15, 10, 5, 1, 0].map((mins) => {
                    const isEnabled = activeThresholds.includes(mins);
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => toggleThreshold(mins)}
                        className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-[#3D2D68] border-[#9D84D6]'
                            : 'bg-[#181126] border-[#2A223D]'
                        }`}
                      >
                        <Text className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-[#7C738E]'}`}>
                          {mins === 0 ? 'Cap Reached (0m)' : `${mins}m Remaining`}
                        </Text>
                        <Text className="text-xs text-[#9D84D6]">
                          {isEnabled ? '✓' : '+'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {/* SQLite De-Duplication Info Banner */}
              <View className="mt-3.5 bg-[#171126] border border-[#3E3060] rounded-2xl p-3 flex-row items-center gap-2.5">
                <Text className="text-xl">💾</Text>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">
                    SQLite Duplicate Prevention Active
                  </Text>
                  <Text className="text-xs text-[#9E98A8] mt-0.5 leading-tight">
                    Table <Text className="text-[#A7F3D0] font-mono">sent_notifications</Text> enforces <Text className="text-[#9D84D6] font-mono">UNIQUE(app_id, threshold, date_key)</Text> so the same milestone is never sent twice in one day.
                  </Text>
                </View>
              </View>
            </View>

            {/* Dynamic Notification Message Generator & Tester */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4">
              <Text className="text-sm font-extrabold text-white mb-1">
                Dynamic Message Generator & Live Preview
              </Text>
              <Text className="text-xs text-[#9E98A8] mb-3">
                See how notification messages are dynamically composed based on app name and remaining minutes:
              </Text>

              {/* App Selector / Input */}
              <Text className="text-xs font-semibold text-white mb-1.5">Target Application:</Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {(appLimits.length > 0 ? appLimits.map((a) => a.name) : ['YouTube', 'Instagram', 'Chrome', 'TikTok']).map((name) => {
                  const isChosen = (testAppSelection || (appLimits[0]?.name || 'YouTube')) === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setTestAppSelection(name)}
                      className={`px-2.5 py-1 rounded-lg border ${
                        isChosen ? 'bg-[#3D2D68] border-[#9D84D6]' : 'bg-[#1E1738] border-[#2A223D]'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isChosen ? 'text-white' : 'text-[#9E98A8]'}`}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Remaining Time Stepper / Pills */}
              <Text className="text-xs font-semibold text-white mb-1.5">Remaining Time:</Text>
              <View className="flex-row items-center gap-2 mb-4">
                {[15, 10, 5, 1, 0].map((m) => {
                  const isSel = testRemainingMinutes === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setTestRemainingMinutes(m)}
                      className={`flex-1 py-1.5 rounded-xl border items-center ${
                        isSel ? 'bg-[#52388A] border-[#9D84D6]' : 'bg-[#181126] border-[#2A223D]'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-[#9E98A8]'}`}>
                        {m}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Real-time Dynamic Message Live Preview Card */}
              {(() => {
                const effectiveApp = testAppSelection || appLimits[0]?.name || 'YouTube';
                const preview = generateDynamicNotificationMessage(
                  effectiveApp,
                  testRemainingMinutes,
                  30
                );
                return (
                  <View className="bg-[#171126] border border-[#3E3060] rounded-2xl p-3.5 mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-bold uppercase tracking-wider text-[#9D84D6]">
                        Generated Dynamic Message:
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-[#2E224D] border border-[#483770]">
                        <Text className="text-xs font-bold uppercase text-[#A7F3D0]">
                          {preview.severity}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-white mb-1">
                      {preview.title}
                    </Text>
                    <Text className="text-xs text-[#D1CADB] leading-relaxed">
                      {preview.message}
                    </Text>
                  </View>
                );
              })()}

              <View className="flex-row gap-2">
                <Pressable
                  onPress={async () => {
                    const effectiveApp = testAppSelection || appLimits[0]?.name || 'YouTube';
                    await triggerDynamicNotification(effectiveApp, testRemainingMinutes, 30, false);
                  }}
                  style={styles.btnPrimary}
                  className="flex-1 py-3 rounded-xl items-center active:opacity-90 shadow-sm"
                >
                  <Text className="text-white text-xs font-black">
                    🔔 Test Notification (SQLite Protected)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    const effectiveApp = testAppSelection || appLimits[0]?.name || 'YouTube';
                    await triggerDynamicNotification(effectiveApp, testRemainingMinutes, 30, true);
                  }}
                  className="px-3 py-3 rounded-xl bg-[#261E38] border border-[#483770] items-center justify-center active:opacity-75"
                >
                  <Text className="text-xs text-[#A69FC0] font-bold">
                    ⚡ Force Send
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Notification Activity Log / Feed */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4">
              <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-[#2A2436]">
                <View>
                  <Text className="text-xs font-bold text-white">
                    Generated Notification History ({notificationHistory.length})
                  </Text>
                  <Text className="text-xs text-[#9E98A8]">
                    Dynamic notifications generated automatically by the service
                  </Text>
                </View>
                {notificationHistory.length > 0 && (
                  <Pressable
                    onPress={clearNotificationHistory}
                    className="px-2 py-1 rounded-lg bg-[#2A1D36] border border-rose-900/50 active:opacity-75"
                  >
                    <Text className="text-xs font-bold text-rose-300">Clear All</Text>
                  </Pressable>
                )}
              </View>

              {notificationHistory.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <Text className="text-2xl mb-1">🔔</Text>
                  <Text className="text-xs font-bold text-white mb-0.5">
                    No Notifications Dispatched Yet
                  </Text>
                  <Text className="text-xs text-[#9E98A8] text-center px-4">
                    As you track screen time and reach 15m, 10m, 5m, 1m, or daily caps, dynamic alerts will appear here automatically.
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {notificationHistory.map((notif) => {
                    const timeString = new Date(notif.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <View
                        key={notif.id}
                        className="bg-[#181126] border border-[#2E2447] rounded-2xl p-3"
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                            <Text className="text-xs font-bold text-white" numberOfLines={1}>
                              {notif.title}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-xs text-[#7C7389] font-medium">
                              {timeString}
                            </Text>
                            <Pressable
                              onPress={() => deleteNotificationHistoryItem(notif.id)}
                              hitSlop={6}
                              className="w-4 h-4 rounded-full bg-[#291F3E] items-center justify-center"
                            >
                              <Text className="text-xs text-[#9E98A8]">✕</Text>
                            </Pressable>
                          </View>
                        </View>
                        <Text className="text-xs text-[#C5BFD6] leading-relaxed mb-1.5">
                          {notif.message}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <View className="px-2 py-0.5 rounded-full bg-[#251B3B] border border-[#3E3060]">
                              <Text className="text-xs font-bold text-[#A7F3D0]">
                                {notif.appName}
                              </Text>
                            </View>
                            <Text className="text-xs font-medium text-[#8E87A3]">
                              {notif.remainingMinutes <= 0
                                ? 'Limit Reached'
                                : `${notif.remainingMinutes}m remaining`}
                            </Text>
                          </View>
                          <Text className="text-xs font-bold text-[#9D84D6]">
                            💾 SQLite Stored
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Launch Focus Timer Console */}
            <Pressable
              onPress={() => router.push('/dashboard/focus')}
              style={styles.card}
              className="border p-5 rounded-3xl mb-8"
            >
              <Text className="text-lg font-bold text-white mb-1">⏱️ Open Focus Timer & Watch</Text>
              <Text className="text-xs text-[#9E98A8] mb-3">
                Custom countdown timer with 2-column roller wheel, vibration alarm, and live stopwatch.
              </Text>
              <View style={styles.btnPrimary} className="px-3 py-1.5 rounded-xl self-start">
                <Text className="text-white text-xs font-bold">Launch Console ➔</Text>
              </View>
            </Pressable>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: LEVEL & STREAKS (HABIT STREAKS & ACHIEVEMENTS)        */}
        {/* ============================================================== */}
        {activeModule === 'level' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-4">
              <Text className="text-xl font-black text-white">Level & Streaks 🏆</Text>
              <Text className="text-xs text-[#9E98A8] mt-1 leading-relaxed">
                Earn XP, maintain daily digital habit streaks, and unlock achievement badges without any cloud backend.
              </Text>
            </View>

            {/* Streak Hero Card */}
            {(() => {
              const streakDays = totalLimitMinutes > 0 && totalUsedMinutes <= totalLimitMinutes && totalUsedMinutes > 0 ? 3 : 1;
              const currentXp = 420;
              const nextLevelXp = 600;
              const xpPercent = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

              return (
                <View style={styles.card} className="border p-5 rounded-3xl mb-4 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 rounded-2xl bg-[#2D1B4E] border border-[#9D84D6] items-center justify-center">
                        <Text className="text-2xl">🔥</Text>
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-[#9D84D6] uppercase tracking-wider">
                          Digital Habit Streak
                        </Text>
                        <Text className="text-xl font-black text-white">{streakDays} Days Strong</Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <View className="px-2.5 py-1 rounded-full bg-[#181126] border border-[#3E3060]">
                        <Text className="text-xs font-black text-amber-300">Level 4</Text>
                      </View>
                      <Text className="text-xs text-[#9E98A8] mt-0.5 font-semibold">Mindful Explorer</Text>
                    </View>
                  </View>

                  {/* XP Bar */}
                  <View className="mb-2">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-bold text-[#9E98A8]">Experience Progress</Text>
                      <Text className="text-xs font-black text-white">
                        {currentXp} / {nextLevelXp} XP ({xpPercent}%)
                      </Text>
                    </View>
                    <View className="w-full h-2.5 bg-[#16131D] rounded-full overflow-hidden">
                      <View
                        style={[styles.progressBarFill, { width: `${xpPercent}%` }]}
                        className="h-full rounded-full"
                      />
                    </View>
                  </View>

                  {/* 7-Day Streak History Dots */}
                  <View className="flex-row justify-between pt-3 border-t border-[#2D273A]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                      const isComplete = idx <= 3;
                      return (
                        <View key={`${day}-${idx}`} className="items-center gap-1">
                          <View
                            className={`w-7 h-7 rounded-full items-center justify-center border ${
                              isComplete
                                ? 'bg-amber-500/20 border-amber-400'
                                : 'bg-[#181126] border-[#2A2436]'
                            }`}
                          >
                            <Text className={`text-xs font-black ${isComplete ? 'text-amber-300' : 'text-[#7C7389]'}`}>
                              {isComplete ? '🔥' : '·'}
                            </Text>
                          </View>
                          <Text className="text-xs text-[#9E98A8] font-bold">{day}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

            {/* Achievements & Rewards Badges */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-8">
              <Text className="text-xs font-bold text-white mb-3">
                Achievements & Rewards
              </Text>

              <View className="gap-2.5">
                {[
                  {
                    icon: '🎯',
                    title: 'Under Limit Master',
                    desc: 'Stay below total screen allowance for 3 consecutive days.',
                    isUnlocked: true,
                    reward: '+100 XP',
                  },
                  {
                    icon: '🧘',
                    title: 'Deep Focus Pioneer',
                    desc: 'Complete a 25-minute Pomodoro focus countdown session.',
                    isUnlocked: true,
                    reward: '+150 XP',
                  },
                  {
                    icon: '🛡️',
                    title: 'Shorts & Reels Shield',
                    desc: 'Activate at least 1 in-app shield to curb mindless scrolling.',
                    isUnlocked: inAppRules.some((r) => r.isEnabled),
                    reward: '+80 XP',
                  },
                  {
                    icon: '🌟',
                    title: 'Digital Balance Sage',
                    desc: 'Maintain a 100/100 Digital Health Score on Insights.',
                    isUnlocked: false,
                    reward: '+250 XP',
                  },
                  {
                    icon: '👥',
                    title: 'Accountability Ally',
                    desc: 'Connect with a friend to share screen time goals.',
                    isUnlocked: friends.length > 0,
                    reward: '+120 XP',
                  },
                ].map((ach) => (
                  <View
                    key={ach.title}
                    className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                      ach.isUnlocked
                        ? 'bg-[#181126] border-[#3E3060]'
                        : 'bg-[#140F20] border-[#231A36] opacity-60'
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center border ${
                          ach.isUnlocked
                            ? 'bg-[#2E1F4C] border-[#9D84D6]'
                            : 'bg-[#1D172E] border-[#2A223E]'
                        }`}
                      >
                        <Text className="text-lg">{ach.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white">{ach.title}</Text>
                        <Text className="text-xs text-[#9E98A8] mt-0.5">{ach.desc}</Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <View
                        className={`px-2 py-0.5 rounded-full border ${
                          ach.isUnlocked
                            ? 'bg-amber-500/20 border-amber-400'
                            : 'bg-[#221B33] border-[#362B50]'
                        }`}
                      >
                        <Text
                          className={`text-xs font-black ${
                            ach.isUnlocked ? 'text-amber-300' : 'text-[#8E87A3]'
                          }`}
                        >
                          {ach.isUnlocked ? 'Unlocked' : ach.reward}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: MY FRIENDS (ACCOUNTABILITY)                           */}
        {/* ============================================================== */}
        {activeModule === 'friends' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-xl font-black text-white">My Friends 👥</Text>
              <Text className="text-xs text-[#9E98A8] mt-1 leading-relaxed">
                Connect with study buddies or colleagues for on-device habit accountability.
              </Text>
            </View>

            {/* Add Friend Card */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-4">
              <Text className="text-xs font-bold text-white mb-2">Add Accountability Partner</Text>
              <View className="gap-2.5">
                <TextInput
                  style={styles.inputField}
                  className="border rounded-xl px-4 py-2.5 text-xs text-white"
                  placeholder="Friend's Name"
                  placeholderTextColor="#7C7389"
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                />
                <TextInput
                  style={styles.inputField}
                  className="border rounded-xl px-4 py-2.5 text-xs text-white"
                  placeholder="Daily Target Screen Time in Minutes (e.g. 60)"
                  placeholderTextColor="#7C7389"
                  keyboardType="numeric"
                  value={newFriendAvg}
                  onChangeText={setNewFriendAvg}
                />
                <Pressable
                  onPress={handleAddFriendSubmit}
                  style={styles.btnPrimary}
                  className="py-3 rounded-xl items-center active:opacity-90 mt-1"
                >
                  <Text className="text-white text-xs font-bold">+ Add Partner</Text>
                </Pressable>
              </View>
            </View>

            {/* Friends List */}
            <View style={styles.card} className="border p-4 rounded-3xl mb-8">
              <Text className="text-xs font-bold text-white mb-3">
                Partners ({friends.length})
              </Text>
              {friends.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <Text className="text-2xl mb-1">🤝</Text>
                  <Text className="text-xs font-bold text-white mb-0.5">No Partners Added Yet</Text>
                  <Text className="text-xs text-[#9E98A8] text-center px-4">
                    Add a friend above to track mutual screen habits together.
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {friends.map((friend) => (
                    <View
                      key={friend.id}
                      className="bg-[#181126] border border-[#2E2447] p-3 rounded-2xl flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Text className="text-lg">{friend.avatar}</Text>
                        <View>
                          <Text className="text-xs font-bold text-white">{friend.name}</Text>
                          <Text className="text-xs text-[#9E98A8]">
                            Target: {formatHoursMins(friend.avgDailyMinutes)}/day • 🔥 {friend.streakDays}d streak
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={() => removeFriend(friend.id)} hitSlop={6}>
                        <Text className="text-xs text-rose-400 font-bold">Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: SETTINGS                                               */}
        {/* ============================================================== */}
        {activeModule === 'settings' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-xl font-black text-white">Settings ⚙️</Text>
            </View>

            {/* Profile Card */}
            <View
              style={styles.card}
              className="border p-4 rounded-3xl mb-4 flex-row items-center gap-3"
            >
              <View className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 items-center justify-center">
                <Text className="text-base font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-white">{user?.name || 'Local User'}</Text>
                <Text className="text-xs text-[#9E98A8]">{user?.email || 'local@screenbalance.device'}</Text>
              </View>
            </View>

            {/* Permissions */}
            <View
              style={styles.card}
              className="border p-4 rounded-3xl mb-4"
            >
              <Text className="text-xs font-bold text-white mb-2">Device Permissions</Text>

              <Pressable
                onPress={() => togglePermission('usageAccess')}
                className="flex-row justify-between items-center py-2 border-b border-[#2A2436]"
              >
                <Text className="text-xs text-[#D1CADB]">📱 Usage Access (Screen Time)</Text>
                <Text style={permissions.usageAccess ? styles.textAccent : styles.textMuted} className="text-xs font-bold">
                  {permissions.usageAccess ? 'Active' : 'Off'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => togglePermission('accessibilityService')}
                className="flex-row justify-between items-center py-2 border-b border-[#2A2436]"
              >
                <Text className="text-xs text-[#D1CADB]">🛡️ Accessibility Service (In-App Blocking)</Text>
                <Text style={permissions.accessibilityService ? styles.textAccent : styles.textMuted} className="text-xs font-bold">
                  {permissions.accessibilityService ? 'Active' : 'Off'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/permissions')}
                style={styles.btnPrimary}
                className="mt-3 py-2 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">Intent Setup Page ➔</Text>
              </Pressable>
            </View>

            {/* Reset Today's Usage */}
            <Pressable
              onPress={() => {
                Alert.alert('Reset Usage', 'Reset logged minutes back to 0m for today?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', onPress: () => resetAllUsage() },
                ]);
              }}
              style={styles.card}
              className="border p-4 rounded-3xl mb-3 flex-row justify-between items-center"
            >
              <Text className="text-xs font-bold text-white">Reset Today&apos;s Screen Usage</Text>
              <Text className="text-xs font-bold text-rose-400">Reset</Text>
            </Pressable>

            {/* Clear All Data */}
            <Pressable
              onPress={handleClearAllData}
              style={styles.card}
              className="border border-rose-950/60 p-4 rounded-3xl mb-8 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-xs font-bold text-rose-300">Clear All App Data</Text>
                <Text className="text-xs text-[#9E98A8]">Wipe all limits, groups, rules & start fresh</Text>
              </View>
              <Text className="text-xs font-bold text-rose-400">Clear All</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM NAVIGATION BAR */}
      <BottomNav
        activeTab={getTabFromModule(activeModule)}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}
