import { Stack } from 'expo-router';
import '../global.css';
import { AppProvider } from '@/context/AppContext';
import NotificationToast from '@/components/NotificationToast';

export default function RootLayout() {
  return (
    <AppProvider>
      <NotificationToast />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="dashboard/index" />
        <Stack.Screen name="dashboard/add-limit" />
        <Stack.Screen name="dashboard/focus" />
      </Stack>
    </AppProvider>
  );
}
