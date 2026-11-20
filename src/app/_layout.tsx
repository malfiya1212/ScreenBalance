import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import '../global.css';
import { AppProvider } from '@/context/AppContext';
import NotificationToast from '@/components/NotificationToast';
import {
  initOwnNotifications,
  markOwnNotificationsSeen,
} from '@/services/localNotificationService';

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;

    // 1. Initialize Android status bar notification channel & permissions
    initOwnNotifications();

    // 2. Listen for user taps on ScreenBalance notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!isMounted) return;

        const notificationId = response.notification.request.identifier;
        markOwnNotificationsSeen(notificationId);

        const data = response.notification.request.content.data as
          | { appName?: string; reason?: string; action?: string }
          | undefined;

        if (data?.action === 'open_restriction') {
          router.push({
            pathname: '/restriction' as any,
            params: {
              appName: data.appName || 'Application',
              reason: data.reason || 'App Restricted',
            },
          });
        } else {
          router.replace('/dashboard');
        }
      }
    );

    return () => {
      isMounted = false;
      responseSubscription.remove();
    };
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="restriction" />
      </Stack>
      <NotificationToast />
    </AppProvider>
  );
}
