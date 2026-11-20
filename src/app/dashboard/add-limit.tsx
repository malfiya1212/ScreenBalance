import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';
import { fetchInstalledApps, InstalledAppItem } from '@/services/installedAppsService';
import { addLimitStyles as styles } from '@/styles';
import { isTablet } from '@/utils/responsive';

const CATEGORIES = ['Social', 'Entertainment', 'Games', 'Communication', 'Productivity'];

export default function AddLimitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addAppLimit, addDeviceApp } = useApp();

  const [installedApps, setInstalledApps] = useState<InstalledAppItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');

  const [selectedApp, setSelectedApp] = useState<InstalledAppItem | null>(null);
  const [customAppName, setCustomAppName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [limitHours, setLimitHours] = useState(0);
  const [limitMinutes, setLimitMinutes] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('Social');
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoadingApps(true);
    try {
      const apps = await fetchInstalledApps();
      setInstalledApps(apps);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchInstalledApps()
      .then((apps) => {
        if (isMounted) {
          setInstalledApps(apps);
          setLoadingApps(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingApps(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter apps by search query and category filter
  const filteredApps = useMemo(() => {
    return installedApps.filter((app) => {
      const matchesSearch =
        app.appName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesCategory =
        activeCategoryFilter === 'All' || app.category === activeCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [installedApps, searchQuery, activeCategoryFilter]);

  const handleSelectApp = (app: InstalledAppItem) => {
    setSelectedApp(app);
    setCustomAppName('');
    setSelectedCategory(app.category || 'Social');
    setError(null);
  };

  const handleSelectCustomName = () => {
    const trimmed = customAppName.trim();
    if (!trimmed) {
      setError('Please enter a valid application name.');
      return;
    }
    const customItem: InstalledAppItem = {
      appName: trimmed,
      packageName: `custom.${trimmed.toLowerCase().replace(/\s+/g, '')}`,
      category: (selectedCategory as InstalledAppItem['category']) || 'Social',
    };
    setSelectedApp(customItem);
    setError(null);
  };

  const handleSave = () => {
    const totalMins = limitHours * 60 + limitMinutes;
    const finalAppName = selectedApp?.appName.trim() || customAppName.trim();

    if (!finalAppName) {
      setError('Please select an installed application from the list above.');
      return;
    }
    if (totalMins <= 0) {
      setError('Please set an allowance of at least 1 minute.');
      return;
    }

    addDeviceApp(finalAppName, selectedCategory, selectedApp?.icon || '');
    addAppLimit(finalAppName, totalMins, selectedCategory);
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-3"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={styles.backButton}
                className="border rounded-xl flex-row items-center gap-2 active:opacity-80 py-2 px-3"
              >
                <Text className="text-lg text-white font-bold">←</Text>
                <Text className="text-sm font-semibold text-[#9E98A8]">Back</Text>
              </Pressable>

              <Text className="text-lg font-black text-white">Add App Limit</Text>
              <View className="w-12" />
            </View>

            {/* Error Message */}
            {error && (
              <View
                style={styles.errorCard}
                className="border rounded-2xl p-4 mb-4 flex-row items-center gap-3"
              >
                <Text className="text-base">⚠️</Text>
                <Text className="text-sm font-bold text-rose-300 flex-1">{error}</Text>
              </View>
            )}

            {/* Real Installed Device Applications Section */}
            <View style={styles.sectionCard} className="border rounded-3xl mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1 pr-2">
                  <Text className="text-base font-extrabold text-white">
                    Physical Device Applications
                  </Text>
                  <Text className="text-xs text-[#A8A1B5] mt-0.5">
                    Select an installed application directly from your device
                  </Text>
                </View>

                {/* Refresh / App count pill */}
                <Pressable
                  onPress={handleRefresh}
                  className="px-3 py-2 rounded-xl bg-[#281E3E] border border-[#483770] flex-row items-center gap-1.5 active:opacity-75"
                  accessibilityRole="button"
                  accessibilityLabel="Rescan installed applications"
                >
                  {loadingApps ? (
                    <ActivityIndicator size="small" color="#A7F3D0" />
                  ) : (
                    <>
                      <Text className="text-xs text-[#A7F3D0] font-bold">
                        ✓ {installedApps.length} Apps
                      </Text>
                      <Text className="text-xs text-[#C5BFD6]">🔄</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Currently Selected Application Indicator */}
              {selectedApp && (
                <View className="bg-[#241A3D] border border-[#7C3AED] rounded-2xl p-3.5 flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    {selectedApp.icon ? (
                      <Image
                        source={{ uri: selectedApp.icon }}
                        className="w-10 h-10 rounded-xl"
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-xl bg-[#3D2D68] items-center justify-center border border-[#9D84D6]">
                        <Text className="text-base font-bold text-[#A7F3D0]">
                          {selectedApp.appName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-[#A7F3D0] font-extrabold">✓ Selected</Text>
                        <Text className="text-xs text-[#D1CADB] font-semibold bg-[#3D2D68] px-2 py-0.5 rounded-md">
                          {selectedCategory}
                        </Text>
                      </View>
                      <Text className="text-base font-bold text-white mt-0.5" numberOfLines={1}>
                        {selectedApp.appName}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setSelectedApp(null)}
                    hitSlop={8}
                    className="px-3 py-1.5 rounded-lg bg-[#3D2D68] border border-[#5B4687] active:opacity-70"
                  >
                    <Text className="text-xs text-[#C5BFD6] font-bold">Change</Text>
                  </Pressable>
                </View>
              )}

              {/* Search Input */}
              <View className="relative mb-3">
                <TextInput
                  style={styles.textInput}
                  className="border rounded-xl px-4 py-3 text-white font-medium pr-10"
                  placeholder="Search installed device apps..."
                  placeholderTextColor="#7C7389"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setError(null);
                  }}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                    className="absolute right-3.5 top-3.5"
                  >
                    <Text className="text-sm text-[#9E98A8] font-bold">✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Category Filter Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {['All', ...CATEGORIES].map((cat) => {
                  const isActive = activeCategoryFilter === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setActiveCategoryFilter(cat)}
                      className={`px-3.5 py-1.5 rounded-xl border ${
                        isActive
                          ? 'bg-[#3D2D68] border-[#9D84D6]'
                          : 'bg-[#1E1738] border-[#2E2554]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isActive ? 'text-white' : 'text-[#8E87A3]'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Installed Apps Grid List */}
              {loadingApps ? (
                <View className="py-8 items-center justify-center gap-2">
                  <ActivityIndicator size="small" color="#9D84D6" />
                  <Text className="text-xs text-[#9E98A8]">
                    Reading installed applications from your device...
                  </Text>
                </View>
              ) : filteredApps.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <Text className="text-sm font-bold text-white mb-1">
                    No Matching Applications
                  </Text>
                  <Text className="text-xs text-[#9E98A8] text-center mb-3">
                    No app matched &quot;{searchQuery}&quot;. You can type an application name manually below.
                  </Text>
                  <Pressable
                    onPress={() => setShowCustomInput(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#3D2D68] border border-[#9D84D6]"
                  >
                    <Text className="text-xs font-bold text-white">+ Enter App Name</Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  nestedScrollEnabled
                  style={{ maxHeight: isTablet ? 280 : 220 }}
                  showsVerticalScrollIndicator={true}
                  className="rounded-2xl border border-[#2B2247] p-2 bg-[#17112B]"
                >
                  <View className="flex-row flex-wrap justify-between gap-y-2">
                    {filteredApps.map((item) => {
                      const isSelected =
                        selectedApp?.packageName === item.packageName ||
                        selectedApp?.appName.toLowerCase() === item.appName.toLowerCase();

                      return (
                        <Pressable
                          key={item.packageName}
                          onPress={() => handleSelectApp(item)}
                          style={{ width: isTablet ? '48.5%' : '100%' }}
                          className={`flex-row items-center gap-3 p-2.5 rounded-xl border ${
                            isSelected
                              ? 'bg-[#3D2D68] border-[#A7F3D0]'
                              : 'bg-[#20183B] border-[#312558] active:bg-[#2A204C]'
                          }`}
                        >
                          {item.icon ? (
                            <Image
                              source={{ uri: item.icon }}
                              className="w-9 h-9 rounded-lg"
                              resizeMode="contain"
                            />
                          ) : (
                            <View className="w-9 h-9 rounded-lg bg-[#2E2350] border border-[#483770] items-center justify-center">
                              <Text className="text-sm font-bold text-[#A7F3D0]">
                                {item.appName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}

                          <View className="flex-1 pr-1">
                            <Text
                              className={`text-sm font-bold ${
                                isSelected ? 'text-white' : 'text-[#E0DBEB]'
                              }`}
                              numberOfLines={1}
                            >
                              {item.appName}
                            </Text>
                            <Text
                              className="text-xs text-[#8E87A3] mt-0.5"
                              numberOfLines={1}
                            >
                              {item.packageName}
                            </Text>
                          </View>

                          {isSelected && (
                            <View className="w-6 h-6 rounded-full bg-[#10B981] items-center justify-center">
                              <Text className="text-xs text-black font-extrabold">✓</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* Custom App Name toggle (Fallback for non-launcher apps) */}
              <View className="mt-3 pt-2.5 border-t border-[#262033]">
                <Pressable
                  onPress={() => setShowCustomInput(!showCustomInput)}
                  className="flex-row items-center justify-between py-1.5"
                >
                  <Text className="text-xs font-semibold text-[#8E87A3]">
                    {showCustomInput ? '▲ Hide Custom Input' : '▼ App not listed? Enter name manually'}
                  </Text>
                </Pressable>

                {showCustomInput && (
                  <View className="flex-row gap-2 mt-2">
                    <TextInput
                      style={styles.textInput}
                      className="flex-1 border rounded-xl px-3.5 py-2.5 text-white font-medium"
                      placeholder="Type application name..."
                      placeholderTextColor="#7C7389"
                      value={customAppName}
                      onChangeText={(text) => {
                        setCustomAppName(text);
                        setError(null);
                      }}
                      onSubmitEditing={handleSelectCustomName}
                      returnKeyType="done"
                    />
                    <Pressable
                      onPress={handleSelectCustomName}
                      className="px-4 py-2.5 rounded-xl bg-[#3D2D68] border border-[#9D84D6] items-center justify-center active:opacity-80"
                    >
                      <Text className="text-xs font-bold text-white">+ Select</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* Time Picker (Dual-Wheel Roller: Scroll and Select Both Supported) */}
            <View style={styles.sectionCard} className="border rounded-3xl mb-4">
              <View className="flex-row justify-between items-center mb-3 px-1">
                <Text className="text-base font-extrabold text-white">Daily Allowance</Text>
                <Text style={styles.timeValueText}>
                  {limitHours > 0 ? `${limitHours}h ` : ''}
                  {limitMinutes}m
                </Text>
              </View>

              <StayFreeTimePicker
                hours={limitHours}
                minutes={limitMinutes}
                onChange={(h, m) => {
                  setLimitHours(h);
                  setLimitMinutes(m);
                  setError(null);
                }}
                maxHours={12}
              />
            </View>

            {/* Category */}
            <View style={styles.sectionCard} className="border rounded-3xl mb-6">
              <Text className="text-base font-extrabold text-white mb-3">Category</Text>
              <View className="flex-row flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={isSelected ? styles.categoryPillSelected : styles.categoryPill}
                      className="border rounded-xl"
                    >
                      <Text
                        style={isSelected ? styles.categoryTextSelected : styles.categoryText}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              style={styles.saveButton}
              className="w-full border rounded-2xl items-center justify-center active:opacity-85 shadow-lg mb-8"
            >
              <Text className="text-white text-lg font-black tracking-wide">
                Save Allowance ➔
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
