import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import BottomNav, { TabType } from '@/components/BottomNav';
import NavigationDrawer, { DrawerModule } from '@/components/NavigationDrawer';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';

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
    permissions,
    togglePermission,
  } = useApp();

  // Navigation State
  const [activeModule, setActiveModule] = useState<DrawerModule>('insights');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Analytics State
  const [selectedHourPoint, setSelectedHourPoint] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Friends State
  const [newFriendName, setNewFriendName] = useState('');

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
  const totalUsedMinutes = singleUsedMinutes + combinedUsedMinutes;

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
    addFriend(newFriendName.trim());
    setNewFriendName('');
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

  // Dynamic list of apps for combined group creation (from device apps and existing limits)
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

  return (
    <SafeAreaView style={{ backgroundColor: '#16131D' }} className="flex-1" edges={['top']}>
      {/* SLIDE-OUT NAVIGATION DRAWER */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeModule={activeModule}
        onSelectModule={(module) => setActiveModule(module)}
      />

      <View style={{ backgroundColor: '#16131D' }} className="flex-1">
        {/* TOP BAR */}
        <View
          style={{ backgroundColor: '#16131D', borderBottomColor: '#251F30' }}
          className="border-b px-4 py-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            {/* Hamburger Button to Open Drawer */}
            <Pressable
              onPress={() => setIsDrawerOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border px-2.5 py-1 rounded-full flex-row items-center gap-1.5"
            >
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[10px] font-bold text-[#D1CADB]">100% Local</Text>
            </View>

            <Pressable
              onPress={handleLogout}
              hitSlop={8}
              style={{ backgroundColor: '#211C2B' }}
              className="px-2.5 py-1.5 rounded-xl active:bg-[#2D263B]"
            >
              <Text className="text-xs font-semibold text-[#9E98A8]">Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================== */}
        {/* MODULE: USAGE INSIGHTS                                         */}
        {/* ============================================================== */}
        {activeModule === 'insights' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Filter Chips Bar (Devices ▾, Usage Time ▾, Chart Toggle) */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View
                  style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                  className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-semibold text-[#D1CADB]">Devices</Text>
                  <Text className="text-[10px] text-[#9E98A8]">▾</Text>
                </View>

                <View
                  style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                  className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                >
                  <Text className="text-xs font-semibold text-[#D1CADB]">Usage Time</Text>
                  <Text className="text-[10px] text-[#9E98A8]">▾</Text>
                </View>
              </View>

              {/* Chart Type Toggle Button (Bar vs Line) */}
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-0.5 rounded-xl flex-row items-center"
              >
                <Pressable
                  onPress={() => setChartType('bar')}
                  style={{
                    backgroundColor: chartType === 'bar' ? '#4A3C63' : 'transparent',
                  }}
                  className="px-2.5 py-1 rounded-lg"
                >
                  <Text style={{ color: chartType === 'bar' ? '#FFFFFF' : '#9E98A8', fontSize: 12 }}>
                    📊
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setChartType('line')}
                  style={{
                    backgroundColor: chartType === 'line' ? '#4A3C63' : 'transparent',
                  }}
                  className="px-2.5 py-1 rounded-lg"
                >
                  <Text style={{ color: chartType === 'line' ? '#FFFFFF' : '#9E98A8', fontSize: 12 }}>
                    📈
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Line Graph Card */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-4 shadow-sm"
            >
              {hourlyUsage.length === 0 ? (
                <View className="h-44 items-center justify-center py-4">
                  <Text className="text-3xl mb-2">📈</Text>
                  <Text className="text-xs font-bold text-white mb-1">No Hourly Usage Logged</Text>
                  <Text className="text-[11px] text-[#9E98A8] text-center px-4">
                    Usage spikes will plot in real-time as you log or track app activity today.
                  </Text>
                </View>
              ) : (
                <View className="h-44 justify-between pt-2 pb-1 relative">
                  {/* Horizontal Grid Guidelines */}
                  <View className="absolute inset-0 justify-between py-4">
                    <View className="w-full h-[1px] bg-[#2A2338]" />
                    <View className="w-full h-[1px] bg-[#2A2338]" />
                    <View className="w-full h-[1px] bg-[#2A2338]" />
                    <View className="w-full h-[1px] bg-[#2A2338]" />
                  </View>

                  {/* Point Nodes Representation */}
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
                              style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
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
                              style={{
                                width: isSelected ? 14 : 10,
                                height: isSelected ? 14 : 10,
                                borderRadius: 7,
                                backgroundColor: '#9D84D6',
                                borderWidth: 2.5,
                                borderColor: '#211C2B',
                              }}
                            />
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Horizontal Timeline Labels */}
                  <View className="flex-row justify-between px-2 pt-2 border-t border-[#2A2338]">
                    {hourlyUsage.map((pt) => (
                      <Text
                        key={pt.timeLabel}
                        style={{
                          color: selectedHourPoint === pt.timeLabel ? '#9D84D6' : '#7C7389',
                          fontWeight: selectedHourPoint === pt.timeLabel ? 'bold' : 'normal',
                        }}
                        className="text-[9px]"
                      >
                        {pt.timeLabel}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Total Usage Callout */}
              <View className="pt-3.5 mt-2 border-t border-[#2D273A] flex-row justify-between items-center">
                <Text className="text-xs font-semibold text-[#9E98A8]">
                  Daily Screen Calculation
                </Text>
                <Pressable
                  onPress={() => setActiveModule('limits')}
                  className="flex-row items-center gap-1 active:opacity-75"
                >
                  <Text style={{ color: '#9D84D6' }} className="text-sm font-extrabold">
                    Total Usage: {formatHoursMins(totalUsedMinutes)} ➔
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Platform Distribution Card (Dynamic) */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
                      <View style={{ width: `${mobileAppPct}%`, backgroundColor: '#9D84D6' }} className="h-full rounded-full" />
                    </View>
                  </View>

                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-xs font-medium text-[#D1CADB]">🌐 Mobile Web</Text>
                      <Text className="text-xs font-bold text-white">{webPct}%</Text>
                    </View>
                    <View className="w-full h-2 bg-[#16131D] rounded-full overflow-hidden">
                      <View style={{ width: `${webPct}%`, backgroundColor: '#7C67B3' }} className="h-full rounded-full" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Ranked Apps List (Dynamic from Real User Limits) */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
                    style={{ backgroundColor: '#4A3C63' }}
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
                        style={{ borderBottomColor: idx === rankedApps.length - 1 ? 'transparent' : '#2A2436' }}
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
        {/* MODULE: HOME DASHBOARD                                         */}
        {/* ============================================================== */}
        {activeModule === 'home' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            {/* Core Engine Diagnostic Card */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-10 h-10 rounded-2xl items-center justify-center"
                >
                  <Text className="text-base text-white">⚙️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">
                    Step 1: Core Engine Active
                  </Text>
                  <Text className="text-[10px] text-[#9E98A8]">
                    Usage Access active. 100% processed locally on phone.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/permissions')}
                style={{ backgroundColor: '#4A3C63' }}
                className="px-2.5 py-1.5 rounded-xl active:opacity-80"
              >
                <Text className="text-[10px] font-bold text-white">Permissions</Text>
              </Pressable>
            </View>

            {/* Daily Screen Allowance Card */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-5 rounded-3xl mb-4 shadow-sm"
            >
              <Text className="text-[10px] font-bold text-[#9E98A8] uppercase tracking-wider mb-1">
                Today's Screen Allowance
              </Text>

              <View className="flex-row items-baseline gap-2 mb-3">
                <Text className="text-4xl font-extrabold text-white">
                  {totalLimitMinutes > 0 ? formatHoursMins(remainingMinutes) : '0m'}
                </Text>
                <Text className="text-xs text-[#9E98A8]">
                  {totalLimitMinutes > 0 ? 'remaining today' : 'remaining (configure limits below)'}
                </Text>
              </View>

              {/* Allowance Progress Bar */}
              <View className="w-full h-2.5 bg-[#16131D] rounded-full overflow-hidden mb-3">
                <View
                  style={{
                    backgroundColor: totalUsedMinutes >= totalLimitMinutes && totalLimitMinutes > 0
                      ? '#EF4444'
                      : '#9D84D6',
                    width: totalLimitMinutes > 0
                      ? `${Math.min((totalUsedMinutes / totalLimitMinutes) * 100, 100)}%`
                      : '0%',
                  }}
                  className="h-full rounded-full"
                />
              </View>

              <View className="flex-row justify-between pt-2 border-t border-[#2D273A]">
                <View>
                  <Text className="text-[10px] text-[#7C7389] font-semibold uppercase">Total Used</Text>
                  <Text className="text-xs font-bold text-white">{formatHoursMins(totalUsedMinutes)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-[#7C7389] font-semibold uppercase">Daily Limit</Text>
                  <Text className="text-xs font-bold text-white">{formatHoursMins(totalLimitMinutes)}</Text>
                </View>
              </View>
            </View>

            {/* Feature Shortcut Cards */}
            <View className="flex-row flex-wrap gap-2.5 mb-5">
              {/* Application Selection (Direct from Device) */}
              <Pressable
                onPress={() => router.push('/dashboard/add-limit')}
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="w-full p-3 rounded-2xl border active:bg-[#2A2436] flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View style={{ backgroundColor: '#4A3C63' }} className="w-9 h-9 rounded-xl items-center justify-center">
                    <Text className="text-base">📱</Text>
                  </View>
                  <View>
                    <Text className="text-xs font-bold text-white">Add App Limit</Text>
                    <Text className="text-[10px] text-[#9E98A8]">
                      Set custom daily allowance
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#9D84D6' }} className="text-xs font-bold">Select ➔</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModule('in-app-blocking')}
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">🛡️</Text>
                <Text className="text-xs font-bold text-white">In-App Blocking</Text>
                <Text className="text-[10px] text-[#9E98A8]">
                  {inAppRules.filter((r) => r.isEnabled).length} active shield(s)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModule('limits')}
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">⏱️</Text>
                <Text className="text-xs font-bold text-white">Usage Limits</Text>
                <Text className="text-[10px] text-[#9E98A8]">
                  {combinedLimits.length} combined group(s)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModule('insights')}
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">📈</Text>
                <Text className="text-xs font-bold text-white">Usage Insights</Text>
                <Text className="text-[10px] text-[#9E98A8]">Line graph & ranked</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModule('friends')}
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="flex-1 min-w-[145px] p-3.5 rounded-2xl border active:bg-[#2A2436]"
              >
                <Text className="text-xl mb-1">👥</Text>
                <Text className="text-xs font-bold text-white">My Friends</Text>
                <Text className="text-[10px] text-[#9E98A8]">7-day average</Text>
              </Pressable>
            </View>

            {/* Active Single Limits */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Individual Limits ({appLimits.length})
              </Text>
              <Pressable
                onPress={() => router.push('/dashboard/add-limit')}
                style={{ backgroundColor: '#4A3C63' }}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ Add App</Text>
              </Pressable>
            </View>

            {appLimits.length === 0 ? (
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">📱</Text>
                <Text className="text-xs font-bold text-white mb-1">No Limits Defined</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
                  Tap below to set your daily allowable screen time with the roller wheel.
                </Text>
                <Pressable
                  onPress={() => router.push('/dashboard/add-limit')}
                  style={{ backgroundColor: '#4A3C63' }}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Set App Limit</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2 mb-8">
                {appLimits.map((app) => (
                  <View
                    key={app.id}
                    style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                    className="border p-3.5 rounded-2xl"
                  >
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-xs font-bold text-white">{app.name}</Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-extrabold text-[#9D84D6]">
                          {app.used}m / {app.limit}m
                        </Text>
                        <Pressable
                          onPress={() => logAppUsage(app.id, 10)}
                          style={{ backgroundColor: '#4A3C63' }}
                          className="px-2 py-0.5 rounded-md"
                        >
                          <Text className="text-[10px] text-white font-bold">+10m</Text>
                        </Pressable>
                      </View>
                    </View>
                    <View className="w-full h-1.5 bg-[#16131D] rounded-full overflow-hidden mb-2">
                      <View
                        style={{
                          width: `${Math.min((app.used / app.limit) * 100, 100)}%`,
                          backgroundColor: '#9D84D6',
                        }}
                        className="h-full rounded-full"
                      />
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[10px] text-[#7C7389]">
                        {Math.max(0, app.limit - app.used)}m remaining
                      </Text>
                      <Pressable onPress={() => deleteAppLimit(app.id)}>
                        <Text className="text-[10px] font-semibold text-rose-400">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: IN-APP BLOCKING (STEP 2 DEEP CONTROL)                  */}
        {/* ============================================================== */}
        {activeModule === 'in-app-blocking' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <View
                style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
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

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-extrabold text-white">
                Active Shields ({inAppRules.length})
              </Text>
              <Pressable
                onPress={() => setIsShieldModalOpen(true)}
                style={{ backgroundColor: '#4A3C63' }}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ Add Shield</Text>
              </Pressable>
            </View>

            {inAppRules.length === 0 ? (
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">🛡️</Text>
                <Text className="text-xs font-bold text-white mb-1">No In-App Shields Configured</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
                  Create granular rules to block Shorts, Reels, or Comments in specific apps.
                </Text>
                <Pressable
                  onPress={() => setIsShieldModalOpen(true)}
                  style={{ backgroundColor: '#4A3C63' }}
                  className="px-4 py-2 rounded-xl active:opacity-90"
                >
                  <Text className="text-white text-xs font-bold">+ Create First Shield</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2.5 mb-8">
                {inAppRules.map((rule) => (
                  <View
                    key={rule.id}
                    style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
                          style={{
                            backgroundColor: rule.isEnabled ? '#4A3C63' : '#16131D',
                            borderColor: rule.isEnabled ? '#9D84D6' : '#2E273B',
                          }}
                          className="border w-11 h-6 rounded-full px-0.5 justify-center"
                        >
                          <View
                            style={{
                              backgroundColor: rule.isEnabled ? '#FFFFFF' : '#7C7389',
                              alignSelf: rule.isEnabled ? 'flex-end' : 'flex-start',
                            }}
                            className="w-5 h-5 rounded-full"
                          />
                        </Pressable>

                        <Pressable onPress={() => deleteInAppRule(rule.id)}>
                          <Text className="text-xs text-rose-400">✕</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Text className="text-[11px] text-[#9E98A8] leading-relaxed">
                      {rule.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Modal to Add Shield */}
            <Modal
              visible={isShieldModalOpen}
              transparent
              animationType="slide"
              onRequestClose={() => setIsShieldModalOpen(false)}
            >
              <View className="flex-1 justify-end bg-black/70">
                <View style={{ backgroundColor: '#211C2B' }} className="rounded-t-3xl p-6 border-t border-[#2E273B]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold text-white">Create In-App Shield</Text>
                    <Pressable onPress={() => setIsShieldModalOpen(false)}>
                      <Text className="text-xs font-bold text-[#9E98A8]">Cancel</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="App Name"
                    placeholderTextColor="#7C7389"
                    value={newShieldApp}
                    onChangeText={setNewShieldApp}
                  />

                  <TextInput
                    style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="Feature name"
                    placeholderTextColor="#7C7389"
                    value={newShieldFeature}
                    onChangeText={setNewShieldFeature}
                  />

                  <TextInput
                    style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-4"
                    placeholder="Description (optional)"
                    placeholderTextColor="#7C7389"
                    value={newShieldDesc}
                    onChangeText={setNewShieldDesc}
                  />

                  <Pressable
                    onPress={handleCreateShieldSubmit}
                    style={{ backgroundColor: '#4A3C63' }}
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
                style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
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
                style={{ backgroundColor: '#4A3C63' }}
                className="px-3 py-1.5 rounded-xl active:opacity-90"
              >
                <Text className="text-white text-xs font-bold">+ New Group</Text>
              </Pressable>
            </View>

            {combinedLimits.length === 0 ? (
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">⏱️</Text>
                <Text className="text-xs font-bold text-white mb-1">No Multi-App Groups</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center mb-3">
                  Group addictive apps together so they share a single daily time limit.
                </Text>
                <Pressable
                  onPress={() => setIsBundleModalOpen(true)}
                  style={{ backgroundColor: '#4A3C63' }}
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
                      style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
                          style={{ width: `${percent}%`, backgroundColor: '#9D84D6' }}
                          className="h-full rounded-full"
                        />
                      </View>

                      <View className="flex-row justify-between items-center pt-2 border-t border-[#2D273A]">
                        <Text className="text-[11px] text-[#9E98A8]">
                          {bundle.used}m used of {bundle.limit}m total
                        </Text>
                        <Pressable
                          onPress={() => logCombinedUsage(bundle.id, 10)}
                          style={{ backgroundColor: '#4A3C63' }}
                          className="px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-[10px] font-bold text-white">+10m</Text>
                        </Pressable>
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
                <View style={{ backgroundColor: '#211C2B' }} className="rounded-t-3xl p-6 border-t border-[#2E273B]">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-base font-bold text-white">Create Combined Group</Text>
                    <Pressable onPress={() => setIsBundleModalOpen(false)}>
                      <Text className="text-xs font-bold text-[#9E98A8]">Cancel</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                    className="border rounded-xl px-4 py-2.5 text-xs mb-3"
                    placeholder="Group name"
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
                            style={{
                              backgroundColor: isSelected ? '#4A3C63' : '#16131D',
                              borderColor: isSelected ? '#9D84D6' : '#2E273B',
                            }}
                            className="border px-3 py-1.5 rounded-xl"
                          >
                            <Text style={{ color: isSelected ? '#FFFFFF' : '#9E98A8' }} className="text-xs font-bold">
                              {isSelected ? '✓ ' : '+ '}
                              {app}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Add Any App from Device */}
                  <View className="flex-row gap-2 mb-3">
                    <TextInput
                      style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                      className="flex-1 border rounded-xl px-3 py-2 text-xs"
                      placeholder="Add device app to group..."
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
                      style={{ backgroundColor: '#4A3C63' }}
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
                    style={{ backgroundColor: '#4A3C63' }}
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
        {/* MODULE: NOTIFICATIONS (100% LOCAL DEVICE ALARMS)               */}
        {/* ============================================================== */}
        {activeModule === 'notifications' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-xl font-black text-white">Usage Notifications</Text>
              <Text className="text-xs text-[#9E98A8] mt-1">
                100% On-Device Alerts: Alarms and 5-minute warnings run directly on your hardware without cloud services.
              </Text>
            </View>

            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-4"
            >
              <Pressable
                onPress={toggleLocalNotifications}
                className="flex-row justify-between items-center py-2.5 border-b border-[#2A2436]"
              >
                <View>
                  <Text className="text-xs font-bold text-white">Local Boundary Alerts</Text>
                  <Text className="text-[10px] text-[#9E98A8]">Warns when approaching daily caps</Text>
                </View>
                <Text style={{ color: localNotificationsEnabled ? '#9D84D6' : '#7C7389' }} className="text-xs font-bold">
                  {localNotificationsEnabled ? 'Active' : 'Off'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  triggerLocalNotification(
                    'Local Screen Warning',
                    '5 minutes remaining on your daily allowance. Running 100% locally on your phone hardware.'
                  )
                }
                style={{ backgroundColor: '#4A3C63' }}
                className="mt-3.5 py-2.5 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">🔔 Test Local Alarm Now</Text>
              </Pressable>
            </View>

            {/* Launch Focus Timer Console */}
            <Pressable
              onPress={() => router.push('/dashboard/focus')}
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-5 rounded-3xl mb-8"
            >
              <Text className="text-lg font-bold text-white mb-1">⏱️ Open Focus Timer & Watch</Text>
              <Text className="text-xs text-[#9E98A8] mb-3">
                Custom countdown timer with 2-column roller wheel, vibration alarm, and live stopwatch.
              </Text>
              <View style={{ backgroundColor: '#4A3C63' }} className="px-3 py-1.5 rounded-xl self-start">
                <Text className="text-white text-xs font-bold">Launch Console ➔</Text>
              </View>
            </Pressable>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: MY FRIENDS (STEP 5 SOCIAL ACCOUNTABILITY)              */}
        {/* ============================================================== */}
        {activeModule === 'friends' && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-xl font-black text-white">My Friends</Text>
              <Text className="text-xs text-[#9E98A8] mt-1">
                7-day average daily device usage comparison to build better habits through social accountability.
              </Text>
            </View>

            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-4"
            >
              <Text className="text-xs font-bold text-white mb-2">Add Friend</Text>
              <View className="flex-row gap-2">
                <TextInput
                  style={{ backgroundColor: '#16131D', borderColor: '#2E273B', color: '#FFFFFF' }}
                  className="border flex-1 rounded-xl px-3 py-2 text-xs"
                  placeholder="Friend name..."
                  placeholderTextColor="#7C7389"
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                />
                <Pressable
                  onPress={handleAddFriendSubmit}
                  style={{ backgroundColor: '#4A3C63' }}
                  className="px-4 py-2 rounded-xl items-center justify-center"
                >
                  <Text className="text-white text-xs font-bold">+ Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Leaderboard */}
            {friends.length === 0 ? (
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-6 rounded-3xl items-center justify-center mb-8"
              >
                <Text className="text-2xl mb-1">👥</Text>
                <Text className="text-xs font-bold text-white mb-1">No Friends Added</Text>
                <Text className="text-[11px] text-[#9E98A8] text-center">
                  Add friends above to compare 7-day average screen time habits on your local device.
                </Text>
              </View>
            ) : (
              <View className="gap-2 mb-8">
                {friends.map((f) => (
                  <View
                    key={f.id}
                    style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                    className="border p-3.5 rounded-2xl flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2.5">
                      <Text className="text-xl">{f.avatar}</Text>
                      <View>
                        <Text className="text-xs font-bold text-white">{f.name}</Text>
                        <Text className="text-[10px] text-[#9E98A8]">🔥 {f.streakDays}-day streak</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-bold text-white">{formatHoursMins(f.avgDailyMinutes)}</Text>
                      <Text className="text-[10px] text-[#9D84D6]">7-day avg</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* MODULE: LEVEL, DESKTOP, INBOX, CATEGORIES                      */}
        {/* ============================================================== */}
        {(activeModule === 'level' ||
          activeModule === 'desktop' ||
          activeModule === 'inbox' ||
          activeModule === 'categories') && (
          <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-5 rounded-3xl mb-8"
            >
              <Text className="text-lg font-bold text-white mb-2">
                {activeModule === 'level' && '🏆 Level & Streaks'}
                {activeModule === 'desktop' && '💻 ScreenBalance for Desktop'}
                {activeModule === 'inbox' && '✉️ Inbox Control'}
                {activeModule === 'categories' && '▲ App Categories'}
              </Text>
              <Text className="text-xs text-[#9E98A8] leading-relaxed mb-4">
                {activeModule === 'level' &&
                  (totalLimitMinutes > 0
                    ? `Discipline status: ${totalUsedMinutes <= totalLimitMinutes ? 'On Track • Mindful Guardian' : 'Over Limit • Adjust your screen time'}`
                    : 'Set daily limits on your apps to start earning discipline levels and mindful streaks.')}
                {activeModule === 'desktop' &&
                  'Pair your desktop client locally to track and sync workstation screen balance without any cloud servers.'}
                {activeModule === 'inbox' &&
                  'Batch your notifications into scheduled delivery digests twice a day to reduce screen triggers.'}
                {activeModule === 'categories' &&
                  'Break down your usage by Entertainment, Social, Communication, Games, and Productivity.'}
              </Text>
              <Pressable
                onPress={() => setActiveModule('insights')}
                style={{ backgroundColor: '#4A3C63' }}
                className="px-4 py-2.5 rounded-xl self-start"
              >
                <Text className="text-white text-xs font-bold">Return to Insights ➔</Text>
              </Pressable>
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
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
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
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-4"
            >
              <Text className="text-xs font-bold text-white mb-2">Device Permissions</Text>

              <Pressable
                onPress={() => togglePermission('usageAccess')}
                className="flex-row justify-between items-center py-2 border-b border-[#2A2436]"
              >
                <Text className="text-xs text-[#D1CADB]">📱 Usage Access (PACKAGE_USAGE_STATS)</Text>
                <Text style={{ color: permissions.usageAccess ? '#9D84D6' : '#7C7389' }} className="text-xs font-bold">
                  {permissions.usageAccess ? 'Active' : 'Off'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => togglePermission('accessibilityService')}
                className="flex-row justify-between items-center py-2 border-b border-[#2A2436]"
              >
                <Text className="text-xs text-[#D1CADB]">🛡️ Accessibility Service (In-App Blocking)</Text>
                <Text style={{ color: permissions.accessibilityService ? '#9D84D6' : '#7C7389' }} className="text-xs font-bold">
                  {permissions.accessibilityService ? 'Active' : 'Off'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/permissions')}
                style={{ backgroundColor: '#4A3C63' }}
                className="mt-3 py-2 rounded-xl items-center"
              >
                <Text className="text-white text-xs font-bold">Intent Setup Page ➔</Text>
              </Pressable>
            </View>

            {/* Reset */}
            <Pressable
              onPress={() => {
                Alert.alert('Reset Usage', 'Reset logged minutes back to 0m for today?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', onPress: () => resetAllUsage() },
                ]);
              }}
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-4 rounded-3xl mb-8 flex-row justify-between items-center"
            >
              <Text className="text-xs font-bold text-white">Reset Today's Screen Usage</Text>
              <Text className="text-xs font-bold text-rose-400">Reset</Text>
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
