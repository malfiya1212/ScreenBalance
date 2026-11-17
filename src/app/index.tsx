import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  const insets = useSafeAreaInsets();

  // Screen Flow: 'welcome' (Intro with "Get Started") -> 'auth' (Login & Register with Google)
  const [screenStep, setScreenStep] = useState<'welcome' | 'auth'>('welcome');

  // Auth Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGetStarted = () => {
    setErrorMessage(null);
    setScreenStep('auth');
  };

  const handleBackToWelcome = () => {
    setErrorMessage(null);
    setScreenStep('welcome');
  };

  const handleSubmitAuth = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. name@domain.com)');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'register' && !cleanName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    const displayName = cleanName
      ? cleanName
      : cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');

    const formattedName =
      displayName.charAt(0).toUpperCase() + displayName.slice(1);

    setUser({
      name: formattedName || 'User',
      email: cleanEmail,
    });

    router.replace('/permissions');
  };

  const handleContinueWithGoogle = () => {
    setUser({
      name: 'Google User',
      email: 'user@gmail.com',
    });
    router.replace('/permissions');
  };

  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <SafeAreaView style={{ backgroundColor: '#16131D' }} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* ============================================================== */}
        {/* STEP 1: WELCOME INTRO PAGE (WITH "GET STARTED ➔" BUTTON)        */}
        {/* ============================================================== */}
        {screenStep === 'welcome' && (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              paddingBottom: bottomPadding,
            }}
            showsVerticalScrollIndicator={false}
            className="px-6 py-5"
          >
            {/* Top Branding & Logo */}
            <View className="items-center mt-3">
              {/* Multi-color ring logo matching StayFree */}
              <View className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 via-amber-300 to-rose-400 items-center justify-center p-[2.5px] mb-4 shadow-lg">
                <View
                  style={{ backgroundColor: '#211C2B' }}
                  className="w-full h-full rounded-full items-center justify-center"
                >
                  <Text className="text-xl font-black text-[#9D84D6]">✓</Text>
                </View>
              </View>

              <Text className="text-3xl font-extrabold text-white tracking-tight text-center mb-1.5">
                ScreenBalance
              </Text>

              <Text className="text-xs font-medium text-[#9E98A8] text-center px-4 leading-relaxed">
                Track daily usage, enforce granular in-app shields, and build mindful screen balance.
              </Text>
            </View>

            {/* Core Feature Highlights */}
            <View className="gap-3.5 my-6">
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-3.5 rounded-2xl flex-row items-center gap-3.5"
              >
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <Text className="text-base">⏱️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">Usage Limits & Grouping</Text>
                  <Text className="text-[11px] text-[#9E98A8]">
                    Combine multiple apps under shared daily time caps.
                  </Text>
                </View>
              </View>

              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-3.5 rounded-2xl flex-row items-center gap-3.5"
              >
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <Text className="text-base">🛡️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">In-App Granular Blocking</Text>
                  <Text className="text-[11px] text-[#9E98A8]">
                    Block Shorts, Reels & Comments while keeping normal use.
                  </Text>
                </View>
              </View>

              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border p-3.5 rounded-2xl flex-row items-center gap-3.5"
              >
                <View
                  style={{ backgroundColor: '#4A3C63' }}
                  className="w-9 h-9 rounded-xl items-center justify-center"
                >
                  <Text className="text-base">📈</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">Interactive Line Analytics</Text>
                  <Text className="text-[11px] text-[#9E98A8]">
                    Hourly spike graphs and ranked screen breakdown.
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Primary "Get Started" Action Button */}
            <View className="w-full gap-3 pt-2">
              <Pressable
                onPress={handleGetStarted}
                accessibilityRole="button"
                style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
                className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
              >
                <Text className="text-white text-base font-extrabold tracking-wide">
                  Get Started ➔
                </Text>
              </Pressable>

              <Text className="text-center text-[10px] text-[#7C7389] mt-1">
                🔒 100% On-Device • No backend servers • Private to your phone
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* STEP 2: LOGIN & REGISTER PAGE (WITH "CONTINUE WITH GOOGLE")     */}
        {/* ============================================================== */}
        {screenStep === 'auth' && (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              paddingBottom: bottomPadding,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className="px-6 py-4"
          >
            {/* Top Navigation Bar: Back Button */}
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={handleBackToWelcome}
                accessibilityRole="button"
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 active:bg-[#2D263B]"
              >
                <Text className="text-base text-white font-bold">←</Text>
                <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
              </Pressable>

              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 via-amber-300 to-rose-400 items-center justify-center p-[1.5px]">
                  <View style={{ backgroundColor: '#211C2B' }} className="w-full h-full rounded-full items-center justify-center">
                    <Text className="text-[10px] font-black text-[#9D84D6]">✓</Text>
                  </View>
                </View>
                <Text className="text-sm font-extrabold text-white">ScreenBalance</Text>
              </View>

              <View className="w-14" />
            </View>

            {/* Auth Title */}
            <View className="items-center mb-5">
              <Text className="text-2xl font-black text-white tracking-tight text-center mb-1">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text className="text-xs text-[#9E98A8] text-center">
                {authMode === 'login'
                  ? 'Sign in to access your on-device screen limits'
                  : 'Start tracking your digital balance locally'}
              </Text>
            </View>

            {/* Login / Register Segmented Toggle Pill */}
            <View
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border p-1 rounded-2xl flex-row mb-5"
            >
              <Pressable
                onPress={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                style={{
                  backgroundColor: authMode === 'login' ? '#4A3C63' : 'transparent',
                }}
                className="flex-1 py-2.5 rounded-xl items-center"
              >
                <Text
                  style={{
                    color: authMode === 'login' ? '#FFFFFF' : '#9E98A8',
                    fontWeight: authMode === 'login' ? 'bold' : 'normal',
                  }}
                  className="text-xs"
                >
                  Sign In
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                style={{
                  backgroundColor: authMode === 'register' ? '#4A3C63' : 'transparent',
                }}
                className="flex-1 py-2.5 rounded-xl items-center"
              >
                <Text
                  style={{
                    color: authMode === 'register' ? '#FFFFFF' : '#9E98A8',
                    fontWeight: authMode === 'register' ? 'bold' : 'normal',
                  }}
                  className="text-xs"
                >
                  Register
                </Text>
              </Pressable>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View
                style={{ backgroundColor: '#3B1824', borderColor: '#7F1D1D' }}
                className="border p-3.5 rounded-2xl mb-4 flex-row items-center gap-2"
              >
                <Text>⚠️</Text>
                <Text className="text-xs font-semibold text-rose-300 flex-1">{errorMessage}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View className="gap-3.5 mb-5">
              {/* Name field (only for Register mode) */}
              {authMode === 'register' && (
                <View>
                  <Text className="text-[10px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                    Full Name
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#211C2B',
                      borderColor: '#2E273B',
                      color: '#FFFFFF',
                    }}
                    className="w-full border rounded-2xl px-4 py-3 text-white text-xs font-medium"
                    placeholder="Enter your name"
                    placeholderTextColor="#7C7389"
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      setErrorMessage(null);
                    }}
                  />
                </View>
              )}

              {/* Email Field */}
              <View>
                <Text className="text-[10px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Email Address
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#211C2B',
                    borderColor: '#2E273B',
                    color: '#FFFFFF',
                  }}
                  className="w-full border rounded-2xl px-4 py-3 text-white text-xs font-medium"
                  placeholder="name@example.com"
                  placeholderTextColor="#7C7389"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMessage(null);
                  }}
                />
              </View>

              {/* Password Field */}
              <View>
                <Text className="text-[10px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Password
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#211C2B',
                    borderColor: '#2E273B',
                    color: '#FFFFFF',
                  }}
                  className="w-full border rounded-2xl px-4 py-3 text-white text-xs font-medium"
                  placeholder="••••••••"
                  placeholderTextColor="#7C7389"
                  secureTextEntry
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage(null);
                  }}
                />
              </View>

              {/* Submit Button (Sign In or Create Account) */}
              <Pressable
                onPress={handleSubmitAuth}
                accessibilityRole="button"
                style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
                className="w-full border py-3.5 rounded-2xl items-center justify-center active:opacity-90 shadow-sm mt-1"
              >
                <Text className="text-white text-sm font-bold tracking-wide">
                  {authMode === 'login' ? 'Sign In ➔' : 'Create Account ➔'}
                </Text>
              </Pressable>
            </View>

            {/* SSO & Alternative Options */}
            <View className="w-full gap-3 pt-1">
              {/* Divider */}
              <View className="flex-row items-center my-1">
                <View style={{ backgroundColor: '#2E273B' }} className="flex-1 h-[1px]" />
                <Text className="text-[10px] font-bold text-[#7C7389] px-3 uppercase tracking-wider">
                  or
                </Text>
                <View style={{ backgroundColor: '#2E273B' }} className="flex-1 h-[1px]" />
              </View>

              {/* Continue with Google Button */}
              <Pressable
                onPress={handleContinueWithGoogle}
                accessibilityRole="button"
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="w-full border py-3.5 rounded-2xl items-center justify-center flex-row active:bg-[#2A2436] shadow-xs"
              >
                <GoogleGLogo />
                <Text className="text-white text-sm font-bold tracking-tight">
                  Continue with Google
                </Text>
              </Pressable>

              {/* Switch Auth Mode Prompt */}
              <Pressable
                onPress={() => {
                  setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
                  setErrorMessage(null);
                }}
                className="py-2 items-center"
              >
                <Text className="text-xs text-[#9E98A8]">
                  {authMode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <Text style={{ color: '#9D84D6' }} className="font-bold">
                        Register
                      </Text>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <Text style={{ color: '#9D84D6' }} className="font-bold">
                        Sign In
                      </Text>
                    </>
                  )}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Google 4-Color 'G' Logo
function GoogleGLogo() {
  return (
    <View className="w-5 h-5 mr-2.5 items-center justify-center">
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2.2,
          borderColor: '#4285F4',
          borderTopColor: '#EA4335',
          borderRightColor: '#FBBC05',
          borderBottomColor: '#34A853',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            right: -1,
            width: 7,
            height: 2.2,
            backgroundColor: '#4285F4',
          }}
        />
      </View>
    </View>
  );
}
