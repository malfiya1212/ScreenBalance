import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { checkNativeUsageAccess } from '@/services/installedAppsService';

export default function PermissionsScreen() {
  const router = useRouter();
  const { permissions, setPermissions } = useApp();

  const [intentLaunched, setIntentLaunched] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dedicated verification function with retries for Android AppOps sync
  const verifyAccessAndNavigate = useCallback(async (isReturningFromSettings = false): Promise<boolean> => {
    setCheckingStatus(true);
    let isAllowed = await checkNativeUsageAccess();

    if (!isAllowed && isReturningFromSettings) {
      // Android AppOps often needs 250-600ms to propagate across process boundaries
      await new Promise((r) => setTimeout(r, 350));
      isAllowed = await checkNativeUsageAccess();
      if (!isAllowed) {
        await new Promise((r) => setTimeout(r, 650));
        isAllowed = await checkNativeUsageAccess();
      }
    }

    setCheckingStatus(false);

    if (isAllowed) {
      setPermissions((prev) => ({
        ...prev,
        usageAccess: true,
      }));
      setStatusMessage(null);
      // Automatically navigate straight to Dashboard
      router.replace('/dashboard');
      return true;
    } else {
      setPermissions((prev) => ({
        ...prev,
        usageAccess: false,
      }));
      if (isReturningFromSettings || intentLaunched) {
        setStatusMessage('Permission not yet detected. Please ensure "Allow usage tracking" is switched ON.');
      }
      return false;
    }
  }, [intentLaunched, router, setPermissions]);

  // Check actual real status on screen load; if already granted, navigate directly to dashboard
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const isAllowed = await checkNativeUsageAccess();
      if (isMounted) {
        if (isAllowed) {
          setPermissions((prev) => ({
            ...prev,
            usageAccess: true,
          }));
          router.replace('/dashboard');
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router, setPermissions]);

  // Detect when user returns from Android Settings: verify actual status & auto-navigate to Dashboard
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await verifyAccessAndNavigate(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [verifyAccessAndNavigate]);

  // Primary action: Grant Permission
  const handleGrantPermission = async () => {
    // Check if permission was already granted first!
    const alreadyAllowed = await checkNativeUsageAccess();
    if (alreadyAllowed) {
      setPermissions((prev) => ({ ...prev, usageAccess: true }));
      setStatusMessage(null);
      router.replace('/dashboard');
      return;
    }

    // Launch Android native settings intent if on Android device
    if (Platform.OS === 'android') {
      try {
        setIntentLaunched(true);
        setStatusMessage(null);
        await Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
      } catch {
        try {
          await Linking.openSettings();
        } catch {
          setStatusMessage('Could not open Settings automatically. Please enable ScreenBalance in Device Settings.');
        }
      }
    } else {
      // In simulator / web testing: toggle explicitly by user
      setPermissions((prev) => ({
        ...prev,
        usageAccess: !prev.usageAccess,
      }));
      if (!permissions.usageAccess) {
        router.replace('/dashboard');
      }
    }
  };

  const handleManualCheck = async () => {
    const success = await verifyAccessAndNavigate(true);
    if (success) {
      router.replace('/dashboard');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer} className="flex-1 justify-between">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              className="w-11 h-11 rounded-full border items-center justify-center active:bg-[#2B234D]"
            >
              <Text className="text-base text-white font-bold">←</Text>
            </Pressable>

            {/* Status Badge (Shows only when Granted) */}
            {permissions.usageAccess ? (
              <View
                style={styles.statusBadgeGranted}
                className="border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
              >
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <Text style={styles.statusTextGranted}>
                  Permission Granted
                </Text>
              </View>
            ) : (
              <View
                style={styles.statusBadgeRequired}
                className="border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
              >
                <View className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <Text style={styles.statusTextRequired}>
                  Action Required
                </Text>
              </View>
            )}
          </View>

          {/* Controlled Center Content */}
          <View className="items-center my-auto py-4">
            <ScreenBalanceLogo size={80} showGlow={true} />

            <Text className="text-3xl font-black text-white tracking-tight text-center mt-5 mb-2">
              Grant Permission
            </Text>

            <Text style={styles.descriptionText} className="text-center px-4 max-w-[460px] mb-4">
              To accurately track your app screen time and enforce healthy limits, ScreenBalance needs Usage Access permission from your device.
            </Text>

            {/* Status Message (Amber Warning Banner when not detected) */}
            {statusMessage && !permissions.usageAccess && (
              <View
                style={styles.statusMessageBannerWarning}
                className="border px-4 py-3 rounded-2xl my-3 flex-row items-center gap-2.5 w-full max-w-[480px]"
              >
                <Text className="text-base">⚠️</Text>
                <Text className="text-xs font-bold text-amber-200 flex-1">
                  {statusMessage}
                </Text>
              </View>
            )}

            {/* Single Focused Permission Card */}
            <Pressable
              onPress={handleGrantPermission}
              accessibilityRole="button"
              accessibilityLabel="Usage access permission card"
              style={[
                styles.permissionCard,
                permissions.usageAccess && styles.permissionCardActive,
              ]}
              className="w-full border rounded-2xl p-4 mt-3 flex-row items-center justify-between active:opacity-90 shadow-sm"
            >
              <View className="flex-row items-center gap-3.5 flex-1 pr-3">
                <View
                  style={permissions.usageAccess ? styles.iconBoxGranted : styles.iconBoxPending}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                >
                  <Text className="text-2xl">⏱️</Text>
                </View>
                <View className="flex-1">
                  <Text style={styles.permissionTitle}>Usage Access</Text>
                  <Text style={styles.permissionSubtext} className="mt-1">
                    {permissions.usageAccess
                      ? 'Active • Monitoring screen time & app allowances'
                      : 'Required to read on-device application usage'}
                  </Text>
                </View>
              </View>

              {permissions.usageAccess ? (
                <View
                  style={styles.statusBadgeGranted}
                  className="border px-3 py-1.5 rounded-full"
                >
                  <Text style={styles.statusTextGranted}>
                    Granted ✓
                  </Text>
                </View>
              ) : (
                <View className="px-3 py-1.5 rounded-full bg-[#352554] border border-[#5A3F8B]">
                  <Text className="text-xs font-bold text-[#C5BFD6]">Enable →</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View className="w-full gap-3 pt-4 pb-2">
            {permissions.usageAccess ? (
              <Pressable
                onPress={() => router.replace('/dashboard')}
                accessibilityRole="button"
                style={styles.primaryButton}
                className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
              >
                <Text className="text-white text-base font-extrabold tracking-wide">
                  Continue to Dashboard ➔
                </Text>
              </Pressable>
            ) : intentLaunched ? (
              <View className="gap-3 w-full">
                <Pressable
                  onPress={handleManualCheck}
                  disabled={checkingStatus}
                  accessibilityRole="button"
                  style={styles.primaryButton}
                  className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
                >
                  {checkingStatus ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-base font-extrabold tracking-wide">
                      I Allowed It ➔ Go to Dashboard
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleGrantPermission}
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  className="w-full border py-3 rounded-2xl items-center justify-center active:opacity-90"
                >
                  <Text style={styles.secondaryButtonText}>
                    Re-open Device Settings
                  </Text>
                </Pressable>
              </View>
            ) : (
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
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
