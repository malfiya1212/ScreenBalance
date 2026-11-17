import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function PermissionsScreen() {
  const router = useRouter();
  const { permissions, setPermissions } = useApp();

  const [intentLaunched, setIntentLaunched] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Detect when user returns from Android Settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && intentLaunched) {
        setPermissions((prev) => ({
          ...prev,
          usageAccess: true,
        }));
        setStatusMessage('Usage access has been enabled for ScreenBalance.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [intentLaunched, setPermissions]);

  // Execute the native Android intent for PACKAGE_USAGE_STATS
  const handleExecuteNativeIntent = async () => {
    if (Platform.OS === 'android') {
      try {
        setIntentLaunched(true);
        await Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
      } catch (error) {
        try {
          await Linking.openSettings();
        } catch (fallbackError) {
          Alert.alert(
            'Open Settings',
            'Please open your phone Settings > Apps > Special App Access > Usage Access and permit ScreenBalance.',
            [{ text: 'OK' }]
          );
        }
      }
    } else {
      try {
        setIntentLaunched(true);
        await Linking.openSettings();
      } catch (err) {
        Alert.alert('Settings', 'Please enable permissions in device settings.');
      }
    }
  };

  const handleContinue = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#16131D' }} className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        className="px-5 py-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View className="w-full pt-1">
          {/* Top Bar with Back option */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={handleContinue}
              hitSlop={10}
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
            >
              <Text className="text-sm text-white font-bold">←</Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
            </Pressable>

            {/* Status Badge */}
            <View
              style={{
                backgroundColor: permissions.usageAccess ? '#1E2D27' : '#332326',
                borderColor: permissions.usageAccess ? '#059669' : '#DC2626',
              }}
              className="border px-3 py-1 rounded-full flex-row items-center gap-1.5"
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  permissions.usageAccess ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <Text
                style={{ color: permissions.usageAccess ? '#34D399' : '#F87171' }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {permissions.usageAccess ? 'Permission Granted' : 'Action Required'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Usage Access
          </Text>

          <Text className="text-xs font-medium text-[#9E98A8] leading-relaxed">
            ScreenBalance requires system-level usage monitoring (PACKAGE_USAGE_STATS) to accurately calculate your daily screen time and enforce focus limits.
          </Text>
        </View>

        {/* Feedback Banner */}
        {statusMessage && (
          <View
            style={{ backgroundColor: '#1E2D27', borderColor: '#059669' }}
            className="border p-3.5 rounded-2xl my-3 flex-row items-center gap-2"
          >
            <Text className="text-base">✅</Text>
            <Text className="text-xs font-bold text-emerald-300 flex-1">
              {statusMessage}
            </Text>
          </View>
        )}

        {/* Middle Content: Explanation & Privacy Guarantee */}
        <View className="gap-3.5 my-5">
          {/* Main Privacy Card (Data stays on the phone) */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-5 rounded-3xl"
          >
            <View className="flex-row items-center gap-3 mb-2">
              <View
                style={{ backgroundColor: '#4A3C63' }}
                className="w-10 h-10 rounded-2xl items-center justify-center"
              >
                <Text className="text-lg">🛡️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">
                  Your Data Stays on Your Phone
                </Text>
                <Text className="text-[10px] font-semibold text-[#9D84D6]">
                  100% On-Device Privacy Guaranteed
                </Text>
              </View>
            </View>

            <Text className="text-xs text-[#9E98A8] leading-relaxed mt-1">
              ScreenBalance does <Text className="font-bold text-white">NOT</Text> use any cloud backend. We do not collect or upload your app history, messages, or keystrokes. All usage metrics are calculated locally on your phone hardware.
            </Text>
          </View>

          {/* Why It's Needed */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-5 rounded-3xl shadow-xs"
          >
            <Text className="text-[10px] font-bold text-[#9D84D6] uppercase tracking-wider mb-3">
              Why We Need This Permission
            </Text>

            <View className="gap-3">
              <View className="flex-row items-start gap-3">
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-7 h-7 rounded-xl items-center justify-center mt-0.5"
                >
                  <Text className="text-xs">⏱️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">Measure Screen Allowance</Text>
                  <Text className="text-[11px] text-[#9E98A8] leading-relaxed">
                    Tracks active minutes for chosen apps to display your remaining daily balance.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-7 h-7 rounded-xl items-center justify-center mt-0.5"
                >
                  <Text className="text-xs">🔔</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">Trigger Mindful Boundaries</Text>
                  <Text className="text-[11px] text-[#9E98A8] leading-relaxed">
                    Delivers local alerts when approaching daily caps and shields apps during focus.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Steps Guide */}
          <View
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="border p-4 rounded-2xl"
          >
            <Text className="text-xs font-bold text-white mb-2">
              How to enable in Android:
            </Text>
            <Text className="text-[11px] text-[#9E98A8] leading-relaxed">
              1. Tap <Text className="font-bold text-white">"Open Android Settings"</Text> below.{"\n"}
              2. Locate <Text className="font-bold text-white">ScreenBalance</Text> in the list.{"\n"}
              3. Toggle <Text className="font-bold text-white">"Permit usage access"</Text> to ON.{"\n"}
              4. Return back here to start using ScreenBalance.
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View className="w-full gap-2.5 pt-1">
          {/* Execute Native Android Intent */}
          <Pressable
            onPress={handleExecuteNativeIntent}
            accessibilityRole="button"
            style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
            className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-base">⚙️</Text>
              <Text className="text-white text-sm font-bold tracking-wide">
                {permissions.usageAccess
                  ? 'Recheck Android Settings ➔'
                  : 'Open Android Settings ➔'}
              </Text>
            </View>
          </Pressable>

          {/* Continue to Dashboard */}
          <Pressable
            onPress={handleContinue}
            accessibilityRole="button"
            style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
            className="w-full border py-3 rounded-2xl items-center justify-center active:bg-[#2A2436]"
          >
            <Text className="text-white text-xs font-bold">
              {permissions.usageAccess
                ? 'Continue to Dashboard ➔'
                : 'I will enable this later — Continue'}
            </Text>
          </Pressable>

          <Text className="text-center text-[10px] text-[#7C7389] mt-1">
            🔒 Protected Android permission • 100% on-device processing
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
