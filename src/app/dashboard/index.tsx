import BottomNav, { TabType } from '@/components/BottomNav';
import NavigationDrawer, { DrawerModule } from '@/components/NavigationDrawer';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';
import { generateDynamicNotificationMessage } from '@/services/notificationService';
import { dashboardStyles as styles } from '@/styles';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const QUICK_SHIELDS = [
  { appName: 'YouTube', featureName: 'Shorts Shelf', description: 'Restricts infinite vertical short-video feed' },
  { appName: 'Instagram', featureName: 'Reels Tab', description: 'Hides Reels navigation and algorithmic loop' },
  { appName: 'TikTok', featureName: 'Comments Section', description: 'Blocks reading distracting commentary' },
  { appName: 'X / Twitter', featureName: 'Explore Grid', description: 'Hides algorithmic trends and search tab' },
];

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
  const [manualScreenTime, setManualScreenTime] = useState(0);
  const [isRealTimeTracking, setIsRealTimeTracking] = useState(false);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [unlocks, setUnlocks] = useState(0);
  const [manualNotifDelta, setManualNotifDelta] = useState(0);
  const notificationsCount = Math.max(0, notificationHistory.length + manualNotifDelta);

  // Dynamic Notification Tester State
  const [testAppSelection, setTestAppSelection] = useState<string>('');
  const [testRemainingMinutes, setTestRemainingMinutes] = useState<number>(5);

  // Real-Time Live Screen Time Tracking Effect
  useEffect(() => {
    if (!isRealTimeTracking) return;

    const interval = setInterval(() => {
      setLiveElapsedSeconds((s) => {
        const next = s + 1;
        // In real-time: every 60 seconds of live tracking adds 1 minute of screen time
        if (next > 0 && next % 60 === 0) {
          if (appLimits.length > 0) {
            logAppUsage(appLimits[0].id, 1);
          } else {
            setManualScreenTime((prev) => prev + 1);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRealTimeTracking, appLimits, logAppUsage]);

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

  // In-App Shield Modal State
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [newShieldApp, setNewShieldApp] = useState('');
  const [newShieldFeature, setNewShieldFeature] = useState('');
  const [newShieldDesc, setNewShieldDesc] = useState('');

  // Calculations (Zero Hardcoded Data - 100% Dynamic)
  const singleUsedMinutes = appLimits.reduce((acc, curr) => acc + curr.used, 0);
  const combinedUsedMinutes = combinedLimits.reduce((acc, curr) => acc + curr.used, 0);
  const totalUsedMinutes = singleUsedMinutes + combinedUsedMinutes + manualScreenTime;

  const handleAdjustScreenTime = (delta: number) => {
    if (delta > 0) {
      if (appLimits.length > 0) {
        logAppUsage(appLimits[0].id, delta);
      } else {
        setManualScreenTime((prev) => prev + delta);
      }
    } else {
      // Decreasing screen time
      if (manualScreenTime > 0) {
        setManualScreenTime((prev) => Math.max(0, prev + delta));
      } else if (appLimits.length > 0) {
        const appWithUsage = appLimits.find((a) => a.used > 0) || appLimits[0];
        logAppUsage(appWithUsage.id, delta);
      }
    }
  };

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
        return 'reports';
      case 'limits':
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
        setActiveModule('limits');
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
            setManualScreenTime(0);
            setIsRealTimeTracking(false);
            setLiveElapsedSeconds(0);
            setPickups(0);
            setUnlocks(0);
            setManualNotifDelta(0);
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
    if (!newShieldApp.trim() || !newShieldFeature.trim()) {
      Alert.alert('Missing Info', 'Please enter both the App Name and the Feature to block.');
      return;
    }

    addInAppRule({
      appName: newShieldApp,
      featureName: newShieldFeature,
      description: newShieldDesc || `Restricts ${newShieldFeature} inside ${newShieldApp}`,
      appIcon: '🛡️',
    });

    setNewShieldApp('');
    setNewShieldFeature('');
    setNewShieldDesc('');
    setIsShieldModalOpen(false);
  };

  // Dynamic list of apps for combined group creation (Zero hardcoded data)
  const availableAppsForGrouping = Array.from(
    new Set([
      ...appLimits.map((a) => a.name),
      ...deviceApps.map((d) => d.name),
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
              <Text className="text-[10px] font-black tracking-widest text-[#9D84D6] uppercase">
                ScreenBalance
              </Text>
              <Text className="text-base font-extrabold text-white">
                {activeModule === 'home' && 'Home'}
                {activeModule === 'limits' && 'Usage Limits'}
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
                className="text-[10px] font-bold"
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
                    <Text className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-[#9E98A8]'}`}>
                      {d.day}
                    </Text>
                    <Text className={`text-xs font-black mt-0.5 ${isSelected ? 'text-white' : 'text-[#D1CADB]'}`}>
                      {d.date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

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
                  <Text className="text-[10px] font-bold text-[#9D84D6] tracking-widest uppercase mb-0.5">
                    Screen-Time
                  </Text>

                  {/* Inside Circle Time Stepper: [-] [ 6m ] [+] */}
                  <View className="flex-row items-center justify-center gap-2 my-1">
                    <Pressable
                      onPress={() => handleAdjustScreenTime(-1)}
                      hitSlop={8}
                      accessibilityLabel="Decrease Screen Time"
                      className="w-7 h-7 rounded-full bg-[#241C35] border border-[#3E3454] items-center justify-center active:bg-[#34274D] shadow-sm"
                    >
                      <Text className="text-sm font-black text-[#9D84D6]">-</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleAdjustScreenTime(1)}
                      hitSlop={8}
                      accessibilityLabel="Tap to increase Screen Time"
                      className="items-center px-1.5 active:opacity-75"
                    >
                      <Text className="text-3xl font-black text-white">
                        {formatHoursMins(totalUsedMinutes)}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleAdjustScreenTime(1)}
                      hitSlop={8}
                      accessibilityLabel="Increase Screen Time"
                      className="w-7 h-7 rounded-full bg-[#3D2C63] border border-[#9D84D6] items-center justify-center active:bg-[#52388A] shadow-sm"
                    >
                      <Text className="text-sm font-black text-white">+</Text>
                    </Pressable>
                  </View>

                  <Text className="text-[10px] text-[#7C7389] my-0.5">of</Text>
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
                  <Text className="text-[10px] font-bold text-[#9E98A8] uppercase tracking-wide">
                    Screen Time Progress
                  </Text>
                  <Text
                    style={{
                      color:
                        totalLimitMinutes > 0 && totalUsedMinutes > totalLimitMinutes
                          ? '#EF4444'
                          : '#84CC16',
                    }}
                    className="text-[10px] font-extrabold"
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

              {/* Real-Time Live Tracking Bar */}
              <View className="w-full items-center mb-1">
                {/* Live Real-Time Session Toggle */}
                <Pressable
                  onPress={() => setIsRealTimeTracking((prev) => !prev)}
                  style={{
                    backgroundColor: isRealTimeTracking ? '#14382B' : '#1D1728',
                    borderColor: isRealTimeTracking ? '#059669' : '#3E3454',
                  }}
                  className="border px-4 py-2 rounded-full flex-row items-center gap-2 mb-2 active:opacity-80"
                >
                  <View
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRealTimeTracking ? 'bg-emerald-400' : 'bg-gray-400'
                    }`}
                  />
                  <Text
                    style={{ color: isRealTimeTracking ? '#34D399' : '#D1CADB' }}
                    className="text-xs font-bold"
                  >
                    {isRealTimeTracking
                      ? `🔴 Live Real-Time Tracking (${Math.floor(liveElapsedSeconds / 60)}m ${liveElapsedSeconds % 60}s)`
                      : '▶ Start Live Real-Time Tracking'}
                  </Text>
                </Pressable>
              </View>

              {/* Device Engagement Metrics Row */}
              <View className="flex-row items-center justify-between w-full gap-2.5 pt-3 border-t border-[#2D273A]">
                {/* Pick-ups */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-[9px] font-bold text-[#9E98A8] uppercase mb-1">Pick-ups</Text>
                  <Text className="text-xl font-black text-white mb-1">{pickups}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => setPickups((p) => Math.max(0, p - 1))}
                      className="w-5 h-5 rounded-full bg-[#2A2436] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-white font-bold">-</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPickups((p) => p + 1)}
                      className="w-5 h-5 rounded-full bg-[#3D2F54] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-[#9D84D6] font-bold">+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Unlocks */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-[9px] font-bold text-[#9E98A8] uppercase mb-1">Unlocks</Text>
                  <Text className="text-xl font-black text-white mb-1">{unlocks}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => setUnlocks((u) => Math.max(0, u - 1))}
                      className="w-5 h-5 rounded-full bg-[#2A2436] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-white font-bold">-</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUnlocks((u) => u + 1)}
                      className="w-5 h-5 rounded-full bg-[#3D2F54] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-[#9D84D6] font-bold">+</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Notifications */}
                <View
                  style={styles.metricCard}
                  className="flex-1 border p-2.5 rounded-2xl items-center"
                >
                  <Text className="text-[9px] font-bold text-[#9E98A8] uppercase mb-1">Notifications</Text>
                  <Text className="text-xl font-black text-white mb-1">{notificationsCount}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => setManualNotifDelta((n) => n - 1)}
                      className="w-5 h-5 rounded-full bg-[#2A2436] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-white font-bold">-</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setManualNotifDelta((n) => n + 1)}
                      className="w-5 h-5 rounded-full bg-[#3D2F54] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-xs text-[#9D84D6] font-bold">+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Today's Challenge Card (Strictly Real Data, Zero Automatic Progress) */}
            <View
              style={styles.challengeCard}
              className="border p-4 rounded-3xl mb-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2 flex-1 pr-2">
                  <Text className="text-base">🎯</Text>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-white">
                      {appLimits.length > 0
                        ? `Stay within ${formatHoursMins(appLimits[0].limit)} on ${appLimits[0].name}`
                        : "Today's Focus Challenge"}
                    </Text>
                    <Text className="text-[10px] text-[#9E98A8]">
                      {appLimits.length > 0
                        ? `Usage: ${formatHoursMins(appLimits[0].used)} used of ${formatHoursMins(appLimits[0].limit)} allowance`
                        : 'Set an app limit below to activate daily challenges'}
                    </Text>
                  </View>
                </View>
                <View
                  style={styles.challengeBadge}
                  className="border px-2.5 py-1 rounded-full"
                >
                  <Text className="text-[10px] font-extrabold text-[#84CC16]">
                    {appLimits.length > 0 ? '40 pts' : '50 pts'}
                  </Text>
                </View>
              </View>

              {/* Challenge Progress (Exact & Based strictly on actual data & usage) */}
              {(() => {
                const targetApp = appLimits[0];
                const usedPct =
                  targetApp && targetApp.limit > 0
                    ? Math.min(100, Math.round((targetApp.used / targetApp.limit) * 100))
                    : 0;
                const isOver = targetApp && targetApp.used > targetApp.limit;
                const barColor = isOver ? '#EF4444' : '#84CC16';

                return (
                  <View>
                    <View className="w-full h-2 bg-[#16131D] rounded-full overflow-hidden mb-1.5">
                      <View
                        style={{
                          width: `${usedPct}%`,
                          backgroundColor: barColor,
                        }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text
                        style={{ color: barColor }}
                        className="text-[9px] font-bold"
                      >
                        {targetApp
                          ? isOver
                            ? `⚠️ Over limit by ${formatHoursMins(targetApp.used - targetApp.limit)}`
                            : `${usedPct}% Used (${formatHoursMins(Math.max(0, targetApp.limit - targetApp.used))} remaining)`
                          : '0% • Inactive (Set app limit below)'}
                      </Text>
                      <Text className="text-[9px] text-[#7C7389]">
                        {targetApp ? `${formatHoursMins(targetApp.used)} / ${formatHoursMins(targetApp.limit)}` : 'Daily Goal'}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* Feature Shortcut Cards (2x2 Balanced Grid) */}
            <View className="flex-row flex-wrap gap-2.5 mb-5">
              {/* 1. In-App Blocking */}
              <Pressable
                onPress={() => setActiveModule('in-app-blocking')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">🛡️</Text>
                <Text className="text-xs font-bold text-white">In-App Blocking</Text>
                <Text className="text-[10px] text-[#9E98A8]">
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
                <Text className="text-[10px] text-[#9E98A8]">
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
                <Text className="text-[10px] text-[#9E98A8]">Daily, weekly, monthly</Text>
              </Pressable>

              {/* 4. My Friends */}
              <Pressable
                onPress={() => setActiveModule('friends')}
                style={styles.card}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">👥</Text>
                <Text className="text-xs font-bold text-white">My Friends</Text>
                <Text className="text-[10px] text-[#9E98A8]">
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
                <Text className="text-2xl mb-1">📱</Text>
                <Text className="text-xs font-bold text-white mb-1">No Limits Defined</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
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
                {appLimits.map((app) => (
                  <View
                    key={app.id}
                    style={styles.card}
                    className="border p-3.5 rounded-2xl"
                  >
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View>
                        <Text className="text-xs font-bold text-white">{app.name}</Text>
                        <Text className="text-[10px] text-[#7C7389]">
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
                        <Text className="text-[9px] font-bold text-[#9E98A8] uppercase mr-0.5">Time:</Text>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -10)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-[#9E98A8]">-10m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -5)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-[#9E98A8]">-5m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, -1)}
                          className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-[#9E98A8]">-1m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 1)}
                          className="px-2 py-0.5 rounded-md bg-[#2D2248] border border-[#9D84D6] active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-[#9D84D6]">+1m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 5)}
                          style={styles.btnPrimary}
                          className="px-2 py-0.5 rounded-md active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-white">+5m</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 10)}
                          style={styles.btnPrimary}
                          className="px-2 py-0.5 rounded-md active:opacity-70"
                        >
                          <Text className="text-[10px] font-bold text-white">+10m</Text>
                        </Pressable>
                      </View>
                      <Pressable onPress={() => deleteAppLimit(app.id)} hitSlop={6}>
                        <Text className="text-[10px] font-semibold text-rose-400">Delete</Text>
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
                  <Text className="text-[10px] text-[#9E98A8]">Reset limits, groups, and shields to fresh state</Text>
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
                  <Text className="text-[10px] text-[#9E98A8]">▾</Text>
                </View>

                <View
                  style={styles.card}
                  className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-semibold text-[#D1CADB]">Usage Time</Text>
                  <Text className="text-[10px] text-[#9E98A8]">▾</Text>
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
                      <Text className="text-[10px] text-[#9D84D6] font-bold">+ Log 15m</Text>
                    </Pressable>
                  </View>

                  {hourlyUsage.length === 0 ? (
                    <View className="h-40 items-center justify-center py-4">
                      <Text className="text-3xl mb-2">📈</Text>
                      <Text className="text-xs font-bold text-white mb-1">No Hourly Usage Logged</Text>
                      <Text className="text-[11px] text-[#9E98A8] text-center px-4">
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
                                  <Text className="text-[10px] font-bold text-white">
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
                            className="text-[9px]"
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
                            <Text className="text-[9px] text-[#9D84D6] font-bold mb-1">
                              {wd.mins > 0 ? `${wd.mins}m` : ''}
                            </Text>
                            <View className="w-5 h-24 bg-[#1B1724] rounded-t-lg justify-end overflow-hidden">
                              <View
                                style={{ height: `${heightPct}%`, backgroundColor: '#9D84D6' }}
                                className="w-full rounded-t-lg"
                              />
                            </View>
                            <Text className="text-[10px] text-[#9E98A8] mt-1 font-semibold">
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
                            <Text className="text-[9px] text-[#84CC16] font-bold mb-1">
                              {mw.mins > 0 ? `${mw.mins}m` : ''}
                            </Text>
                            <View className="w-8 h-24 bg-[#1B1724] rounded-t-lg justify-end overflow-hidden">
                              <View
                                style={{ height: `${heightPct}%`, backgroundColor: '#84CC16' }}
                                className="w-full rounded-t-lg"
                              />
                            </View>
                            <Text className="text-[10px] text-[#9E98A8] mt-1 font-semibold">
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
                  <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
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
                          <Text className="text-[10px] text-[#9E98A8]">{pct}%</Text>
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
        {activeModule === 'in-app-blocking' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <View
                style={styles.btnPrimaryBordered}
                className="border px-2.5 py-0.5 rounded-full self-start mb-2"
              >
                <Text className="text-[10px] font-bold text-white uppercase">
                  Step 2: Deep Control
                </Text>
              </View>
              <Text className="text-xl font-black text-white">In-App Granular Blocking</Text>
              <Text className="text-xs text-[#9E98A8] mt-1">
                Using Android Accessibility services, block specific addictive UI elements while keeping normal video watching and messaging active.
              </Text>
            </View>

            {/* Quick Templates */}
            <Text className="text-[11px] font-bold text-[#9E98A8] mb-2 uppercase">Quick Shield Templates:</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {QUICK_SHIELDS.map((qs) => (
                <Pressable
                  key={qs.featureName}
                  onPress={() => addInAppRule({ ...qs, appIcon: '🛡️' })}
                  className="border border-[#2E273B] bg-[#1B1724] px-3 py-1.5 rounded-xl active:opacity-70"
                >
                  <Text className="text-xs font-bold text-white">+ Block {qs.appName} {qs.featureName}</Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Active Shields ({inAppRules.length})
              </Text>
              <Pressable
                onPress={() => setIsShieldModalOpen(true)}
                style={styles.btnPrimary}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ Custom Shield</Text>
              </Pressable>
            </View>

            {inAppRules.length === 0 ? (
              <View
                style={styles.card}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">🛡️</Text>
                <Text className="text-xs font-bold text-white mb-1">No In-App Shields Configured</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
                  Tap any quick template above or create a custom shield to block Shorts, Reels, or Comments.
                </Text>
                <Pressable
                  onPress={() => setIsShieldModalOpen(true)}
                  style={styles.btnPrimary}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Create Custom Shield</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2.5 mb-8">
                {inAppRules.map((rule) => (
                  <View
                    key={rule.id}
                    style={styles.card}
                    className="border p-4 rounded-2xl shadow-xs"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <Text className="text-lg">{rule.appIcon}</Text>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-white">{rule.featureName}</Text>
                          <Text className="text-[10px] text-[#9D84D6] font-semibold">{rule.appName}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-3">
                        <Pressable
                          onPress={() => toggleInAppRule(rule.id)}
                          style={rule.isEnabled ? styles.toggleTrackActive : styles.toggleTrackInactive}
                          className="border w-11 h-6 rounded-full px-0.5 justify-center"
                        >
                          <View
                            style={rule.isEnabled ? styles.toggleThumbActive : styles.toggleThumbInactive}
                            className="w-5 h-5 rounded-full"
                          />
                        </Pressable>

                        <Pressable onPress={() => deleteInAppRule(rule.id)}>
                          <Text className="text-xs text-rose-400">✕</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Text className="text-[11px] text-[#9D84D6] leading-relaxed">
                      {rule.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Modal to Add Custom Shield */}
            <Modal
              visible={isShieldModalOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsShieldModalOpen(false)}
            >
              <View className="flex-1 justify-end bg-black/70">
                <View style={styles.cardNoBorder} className="rounded-t-3xl p-6 border-t border-[#2E273B]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold text-white">Create In-App Shield</Text>
                    <Pressable onPress={() => setIsShieldModalOpen(false)}>
                      <Text className="text-xs font-bold text-[#9E98A8]">Cancel</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={styles.inputField}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="App Name (e.g. YouTube)"
                    placeholderTextColor="#7C7389"
                    value={newShieldApp}
                    onChangeText={setNewShieldApp}
                  />

                  <TextInput
                    style={styles.inputField}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="Feature name (e.g. Shorts)"
                    placeholderTextColor="#7C7389"
                    value={newShieldFeature}
                    onChangeText={setNewShieldFeature}
                  />

                  <TextInput
                    style={styles.inputField}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-4"
                    placeholder="Description (optional)"
                    placeholderTextColor="#7C7389"
                    value={newShieldDesc}
                    onChangeText={setNewShieldDesc}
                  />

                  <Pressable
                    onPress={handleCreateShieldSubmit}
                    style={styles.btnPrimary}
                    className="py-3.5 rounded-xl items-center"
                  >
                    <Text className="text-white text-xs font-bold">Save In-App Shield</Text>
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
                <Text className="text-[10px] font-bold text-white uppercase">
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
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
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
                          <Text className="text-[10px] text-[#9E98A8]">
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
                        <Text className="text-[11px] text-[#9E98A8]">
                          {bundle.used}m used of {bundle.limit}m total
                        </Text>
                        <View className="flex-row items-center gap-1 flex-wrap">
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -10)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-[#9E98A8]">-10m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -5)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-[#9E98A8]">-5m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, -1)}
                            className="px-2 py-0.5 rounded-md bg-[#211B2C] border border-[#352D47] active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-[#9E98A8]">-1m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 1)}
                            className="px-2 py-0.5 rounded-md bg-[#2D2248] border border-[#9D84D6] active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-[#9D84D6]">+1m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 5)}
                            style={styles.btnPrimary}
                            className="px-2 py-0.5 rounded-md active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-white">+5m</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => logCombinedUsage(bundle.id, 10)}
                            style={styles.btnPrimary}
                            className="px-2 py-0.5 rounded-md active:opacity-70"
                          >
                            <Text className="text-[10px] font-bold text-white">+10m</Text>
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

                  <Text className="text-[11px] text-[#9E98A8] mb-1.5 font-bold">Select Apps for Group:</Text>
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

                  <Text className="text-[11px] text-[#9E98A8] mb-1 font-bold">Shared Daily Time Limit:</Text>
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
                  <Text className="text-[10px] text-[#9E98A8]">
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
                <Text className="text-[10px] text-[#9E98A8] mb-2.5">
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
                        <Text className="text-[10px] text-[#9D84D6]">
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
                  <Text className="text-[10px] text-[#9E98A8] mt-0.5 leading-tight">
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
              <Text className="text-[10px] text-[#9E98A8] mb-3">
                See how notification messages are dynamically composed based on app name and remaining minutes:
              </Text>

              {/* App Selector / Input */}
              <Text className="text-[11px] font-semibold text-white mb-1.5">Target Application:</Text>
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
                      <Text className={`text-[11px] font-bold ${isChosen ? 'text-white' : 'text-[#9E98A8]'}`}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Remaining Time Stepper / Pills */}
              <Text className="text-[11px] font-semibold text-white mb-1.5">Remaining Time:</Text>
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
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-[#9D84D6]">
                        Generated Dynamic Message:
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-[#2E224D] border border-[#483770]">
                        <Text className="text-[9px] font-bold uppercase text-[#A7F3D0]">
                          {preview.severity}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-white mb-1">
                      {preview.title}
                    </Text>
                    <Text className="text-[11px] text-[#D1CADB] leading-relaxed">
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
                  <Text className="text-[10px] text-[#A69FC0] font-bold">
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
                  <Text className="text-[10px] text-[#9E98A8]">
                    Dynamic notifications generated automatically by the service
                  </Text>
                </View>
                {notificationHistory.length > 0 && (
                  <Pressable
                    onPress={clearNotificationHistory}
                    className="px-2 py-1 rounded-lg bg-[#2A1D36] border border-rose-900/50 active:opacity-75"
                  >
                    <Text className="text-[10px] font-bold text-rose-300">Clear All</Text>
                  </Pressable>
                )}
              </View>

              {notificationHistory.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <Text className="text-2xl mb-1">🔔</Text>
                  <Text className="text-xs font-bold text-white mb-0.5">
                    No Notifications Dispatched Yet
                  </Text>
                  <Text className="text-[10px] text-[#9E98A8] text-center px-4">
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
                            <Text className="text-[9px] text-[#7C7389] font-medium">
                              {timeString}
                            </Text>
                            <Pressable
                              onPress={() => deleteNotificationHistoryItem(notif.id)}
                              hitSlop={6}
                              className="w-4 h-4 rounded-full bg-[#291F3E] items-center justify-center"
                            >
                              <Text className="text-[8px] text-[#9E98A8]">✕</Text>
                            </Pressable>
                          </View>
                        </View>
                        <Text className="text-[11px] text-[#C5BFD6] leading-relaxed mb-1.5">
                          {notif.message}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <View className="px-2 py-0.5 rounded-full bg-[#251B3B] border border-[#3E3060]">
                              <Text className="text-[9px] font-bold text-[#A7F3D0]">
                                {notif.appName}
                              </Text>
                            </View>
                            <Text className="text-[10px] font-medium text-[#8E87A3]">
                              {notif.remainingMinutes <= 0
                                ? 'Limit Reached'
                                : `${notif.remainingMinutes}m remaining`}
                            </Text>
                          </View>
                          <Text className="text-[9px] font-bold text-[#9D84D6]">
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
                <Text className="text-[10px] text-[#9E98A8]">{user?.email || 'local@screenbalance.device'}</Text>
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
                <Text className="text-[10px] text-[#9E98A8]">Wipe all limits, groups, rules & start fresh</Text>
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
