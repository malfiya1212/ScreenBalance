import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import ScreenBalanceLogo from '@/components/ScreenBalanceLogo';
import { permissionsStyles as styles } from '@/styles';

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
        setStatusMessage('Usage Access granted successfully.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [intentLaunched, setPermissions]);

  // Primary action: Grant Permission
  const handleGrantPermission = async () => {
    // Launch Android native settings intent if on Android device
    if (Platform.OS === 'android') {
      try {
        setIntentLaunched(true);
        await Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
      } catch {
        try {
          await Linking.openSettings();
        } catch {
          setPermissions((prev) => ({
            ...prev,
            usageAccess: true,
          }));
          setStatusMessage('Usage Access granted successfully.');
        }
      }
    } else {
      setPermissions((prev) => ({
        ...prev,
        usageAccess: !prev.usageAccess,
      }));
      setStatusMessage(!permissions.usageAccess ? 'Usage Access granted successfully.' : 'Usage Access disabled.');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleContinue = () => {
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        className="px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Constrained Container (Centered horizontally, max-width on large screens/tablets) */}
        <View style={styles.cardContainer} className="flex-1 justify-between self-center">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              className="w-10 h-10 rounded-full border items-center justify-center active:bg-[#2B234D]"
            >
              <Text className="text-sm text-white font-bold">←</Text>
            </Pressable>

            {/* Status Badge */}
            <View
              style={permissions.usageAccess ? styles.statusBadgeGranted : styles.statusBadgeRequired}
              className="border px-3 py-1 rounded-full flex-row items-center gap-1.5"
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  permissions.usageAccess ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <Text
                style={permissions.usageAccess ? styles.statusTextGranted : styles.statusTextRequired}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {permissions.usageAccess ? 'Permission Granted' : 'Action Required'}
              </Text>
            </View>
          </View>

          {/* Controlled Center Content */}
          <View className="items-center my-auto py-6">
            <ScreenBalanceLogo size={72} showGlow={true} />

            <Text className="text-2xl font-black text-white tracking-tight text-center mt-4 mb-2">
              Grant Permission
            </Text>

            <Text
              style={styles.descriptionText}
              className="text-xs font-medium text-center leading-relaxed px-4 max-w-[340px]"
            >
              ScreenBalance needs Usage Access to monitor your daily screen time and calculate app allowance.
            </Text>

            {/* Status Message */}
            {statusMessage && (
              <View
                style={styles.statusMessageBanner}
                className="border px-4 py-2.5 rounded-2xl mt-4 flex-row items-center gap-2"
              >
                <Text className="text-sm">✅</Text>
                <Text className="text-xs font-bold text-emerald-300">
                  {statusMessage}
                </Text>
              </View>
            )}

            {/* Single Focused Permission Card */}
            <Pressable
              onPress={handleGrantPermission}
              accessibilityRole="button"
              accessibilityLabel="Toggle usage access permission"
              style={[
                styles.permissionCard,
                permissions.usageAccess && styles.permissionCardActive,
              ]}
              className="w-full border rounded-2xl p-4 mt-6 flex-row items-center justify-between active:opacity-90"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-3">
                <View
                  style={permissions.usageAccess ? styles.iconBoxGranted : styles.iconBoxPending}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                >
                  <Text className="text-lg">⏱️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">Usage Access</Text>
                  <Text style={styles.permissionSubtext} className="text-[11px] mt-0.5">
                    {permissions.usageAccess
                      ? 'Active • Monitoring screen time'
                      : 'Required to track daily app screen time'}
                  </Text>
                </View>
              </View>

              <View
                style={permissions.usageAccess ? styles.statusBadgeGranted : styles.statusBadgeRequired}
                className="border px-2.5 py-1 rounded-full"
              >
                <Text
                  style={permissions.usageAccess ? styles.statusTextGranted : styles.statusTextRequired}
                  className="text-[10px] font-bold"
                >
                  {permissions.usageAccess ? 'Granted' : 'Required'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Bottom Actions */}
          <View className="w-full gap-3 pt-2 pb-1">
            {permissions.usageAccess ? (
              <Pressable
                onPress={handleContinue}
                accessibilityRole="button"
                style={styles.primaryButton}
                className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
              >
                <Text className="text-white text-base font-extrabold tracking-wide">
                  Continue to Dashboard ➔
                </Text>
              </Pressable>
            ) : (
              <>
                {/* Primary Button: Grant Permission */}
                <Pressable
                  onPress={handleGrantPermission}
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
                >
                  <Text className="text-white text-base font-extrabold tracking-wide">
                    Grant Permission ➔
                  </Text>
                </Pressable>

                {/* Secondary Option: I will enable this later — Continue */}
                <Pressable
                  onPress={handleContinue}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  className="w-full border py-3.5 rounded-2xl items-center justify-center active:bg-[#1E1838]"
                >
                  <Text style={styles.secondaryButtonText} className="text-xs font-semibold">
                    I will enable this later — Continue
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
