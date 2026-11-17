import { Stack } from 'expo-router';
import '../global.css';
import { AppProvider } from '@/context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="dashboard/index" />
        <Stack.Screen name="dashboard/add-limit" />
        <Stack.Screen name="dashboard/focus" />
      </Stack>
    </AppProvider>
  );
}
