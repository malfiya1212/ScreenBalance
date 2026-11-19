import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';
import { addLimitStyles as styles } from '@/styles';

const CATEGORIES = ['Social', 'Entertainment', 'Games', 'Communication', 'Productivity'];

export default function AddLimitScreen() {
  const router = useRouter();
  const { addAppLimit, deviceApps, addDeviceApp, removeDeviceApp } = useApp();

  const [appName, setAppName] = useState('');
  const [limitHours, setLimitHours] = useState(0);
  const [limitMinutes, setLimitMinutes] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('Social');
  const [error, setError] = useState<string | null>(null);

  // Dynamic Device Application Input & Filter (Zero Hardcoded Data)
  const [appInput, setAppInput] = useState('');

  // Launch Native System App Settings / Manager Intent on Physical Device
  const handleOpenSystemAppSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        const IntentLauncher = await import('expo-intent-launcher');
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_SETTINGS
        );
      } else {
        await Linking.openSettings();
      }
    } catch {
      try {
        await Linking.openSettings();
      } catch {
        Alert.alert(
          'System Settings',
          'Please open your device settings to view all installed applications.'
        );
      }
    }
  };

  const handleSelectApp = (app: { name: string; category: string }) => {
    setAppName(app.name);
    setSelectedCategory(app.category);
    setAppInput(app.name);
    setError(null);
  };

  const handleAddAndSelectApp = () => {
    const trimmed = appInput.trim();
    if (!trimmed) {
      setError('Please enter an installed application name from your device.');
      return;
    }
    // Check if not already in deviceApps
    const exists = deviceApps.some(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      addDeviceApp(trimmed, selectedCategory, '📱');
    }
    setAppName(trimmed);
    setError(null);
  };

  const handleSave = () => {
    const totalMins = limitHours * 60 + limitMinutes;
    const finalAppName = appName.trim() || appInput.trim();
    if (!finalAppName) {
      setError('Please select or enter an installed application name from your device.');
      return;
    }
    if (totalMins <= 0) {
      setError('Please set an allowance of at least 1 minute.');
      return;
    }

    // Ensure it's in deviceApps
    const exists = deviceApps.some(
      (d) => d.name.toLowerCase() === finalAppName.toLowerCase()
    );
    if (!exists) {
      addDeviceApp(finalAppName, selectedCategory, '📱');
    }

    addAppLimit(finalAppName, totalMins, selectedCategory);
    router.replace('/dashboard');
  };

  // Filter device apps by current text input
  const filteredDeviceApps = deviceApps.filter((d) =>
    d.name.toLowerCase().includes(appInput.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              style={styles.backButton}
              className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:opacity-80"
            >
              <Text className="text-base text-white font-bold">←</Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
            </Pressable>

            <Text className="text-base font-extrabold text-white">Add App Limit</Text>
            <View className="w-12" />
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={styles.errorCard}
              className="border rounded-2xl p-3.5 mb-4 flex-row items-center gap-2"
            >
              <Text>⚠️</Text>
              <Text className="text-xs font-semibold text-rose-300 flex-1">{error}</Text>
            </View>
          )}

          {/* Physical Device Applications Section (Zero Hardcoding) */}
          <View style={styles.sectionCard} className="border p-4 rounded-3xl mb-4">
            <View className="flex-row justify-between items-center mb-2.5">
              <View>
                <Text className="text-xs font-bold text-white">Physical Device Application</Text>
                <Text className="text-[10px] text-[#9E98A8]">
                  Select or enter any application installed on your device
                </Text>
              </View>

              {/* Native System Installed Apps Settings Launcher */}
              <Pressable
                onPress={handleOpenSystemAppSettings}
                className="px-2.5 py-1.5 rounded-xl bg-[#281E3E] border border-[#483770] flex-row items-center gap-1 active:opacity-75"
                accessibilityRole="button"
                accessibilityLabel="Open Phone Installed Applications in System Settings"
              >
                <Text className="text-[11px] text-[#A7F3D0] font-bold">
                  📱 Open Installed Apps
                </Text>
              </Pressable>
            </View>

            {/* Input & Add from Physical Device */}
            <View className="flex-row gap-2 mb-3">
              <TextInput
                style={styles.textInput}
                className="flex-1 border rounded-xl px-4 py-2.5 text-white text-xs font-medium"
                placeholder="Type installed app name from your phone..."
                placeholderTextColor="#7C7389"
                value={appInput}
                onChangeText={(text) => {
                  setAppInput(text);
                  setAppName(text);
                  setError(null);
                }}
                onSubmitEditing={handleAddAndSelectApp}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddAndSelectApp}
                className="px-3.5 py-2.5 rounded-xl bg-[#3D2D68] border border-[#9D84D6] items-center justify-center active:opacity-80"
              >
                <Text className="text-xs font-bold text-white">+ Select</Text>
              </Pressable>
            </View>

            {/* Selected Application Indicator */}
            {appName ? (
              <View className="bg-[#241A3D] border border-[#483770] rounded-xl px-3 py-2 flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-[#A7F3D0] font-bold">✓</Text>
                  <Text className="text-xs font-bold text-white">
                    Selected: <Text className="text-[#A7F3D0]">{appName}</Text> ({selectedCategory})
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setAppName('');
                    setAppInput('');
                  }}
                  hitSlop={8}
                >
                  <Text className="text-[10px] text-[#9E98A8]">Clear</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Device Applications List (Dynamically Added by User on Device) */}
            {deviceApps.length > 0 && (
              <View>
                <Text className="text-[11px] font-semibold text-[#8E87A3] mb-2">
                  Your Device Applications ({deviceApps.length}):
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {filteredDeviceApps.map((item) => {
                    const isSelected =
                      (appName || appInput).trim().toLowerCase() === item.name.toLowerCase();
                    return (
                      <View
                        key={item.id}
                        className={`border px-3 py-1.5 rounded-xl flex-row items-center gap-2 ${
                          isSelected
                            ? 'bg-[#3D2D68] border-[#9D84D6]'
                            : 'bg-[#1E1738] border-[#2E2554]'
                        }`}
                      >
                        <Pressable
                          onPress={() => handleSelectApp(item)}
                          className="flex-row items-center gap-1.5 active:opacity-80"
                        >
                          <Text className="text-xs">{item.icon || '📱'}</Text>
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-white' : 'text-[#C5BFD6]'
                            }`}
                          >
                            {item.name}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => removeDeviceApp(item.id)}
                          hitSlop={8}
                          className="ml-1 active:opacity-60"
                        >
                          <Text className="text-[10px] text-rose-400 font-bold">✕</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Time Picker (Dual-Wheel Roller: Scroll and Select Both Supported) */}
          <View style={styles.sectionCard} className="border p-4 rounded-3xl mb-4">
            <View className="flex-row justify-between items-center mb-2 px-1">
              <Text className="text-xs font-bold text-white">Daily Allowance</Text>
              <Text style={styles.timeValueText} className="text-xs font-bold">
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
          <View style={styles.sectionCard} className="border p-4 rounded-3xl mb-6">
            <Text className="text-xs font-bold text-white mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={isSelected ? styles.categoryPillSelected : styles.categoryPill}
                    className="border px-3 py-1.5 rounded-xl"
                  >
                    <Text
                      style={isSelected ? styles.categoryTextSelected : styles.categoryText}
                      className="text-xs font-semibold"
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
            className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-sm mb-12"
          >
            <Text className="text-white text-sm font-bold tracking-wide">Save Allowance ➔</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
