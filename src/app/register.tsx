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

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useApp();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleRegister = () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. name@domain.com)');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formattedName =
      cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    setTimeout(() => {
      setUser({
        name: formattedName,
        email: cleanEmail,
      });
      setIsLoading(false);
      router.replace('/permissions');
    }, 250);
  };

  const handleContinueWithGoogle = () => {
    setUser({
      name: 'Google User',
      email: 'user@gmail.com',
    });
    router.replace('/permissions');
  };

  const bottomPadding = Math.max(insets.bottom, 20);

  return (
    <SafeAreaView style={{ backgroundColor: '#16131D' }} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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
          {/* Top Bar Navigation */}
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
              className="border px-3.5 py-2 rounded-xl flex-row items-center gap-2 active:bg-[#2D263B]"
            >
              <Text className="text-base text-white font-bold">←</Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
            </Pressable>

            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 via-amber-300 to-rose-400 items-center justify-center p-[1.5px]">
                <View
                  style={{ backgroundColor: '#211C2B' }}
                  className="w-full h-full rounded-full items-center justify-center"
                >
                  <Text className="text-[10px] font-black text-[#9D84D6]">✓</Text>
                </View>
              </View>
              <Text className="text-sm font-extrabold text-white">ScreenBalance</Text>
            </View>

            <View className="w-14" />
          </View>

          {/* Main Content Area */}
          <View className="flex-1 justify-center py-2">
            {/* Title Header */}
            <View className="items-center mb-5">
              <View
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="w-14 h-14 border rounded-2xl items-center justify-center mb-3 shadow-md"
              >
                <Text className="text-2xl">✨</Text>
              </View>
              <Text className="text-2xl font-black text-white tracking-tight text-center mb-1.5">
                Create Account
              </Text>
              <Text className="text-xs text-[#9E98A8] text-center max-w-[290px] leading-relaxed">
                Take control of your digital focus and build healthy screen habits locally.
              </Text>
            </View>

            {/* Error Message Banner */}
            {errorMessage && (
              <View
                style={{ backgroundColor: '#3B1824', borderColor: '#7F1D1D' }}
                className="border p-3.5 rounded-2xl mb-4 flex-row items-center gap-2.5"
              >
                <Text className="text-sm">⚠️</Text>
                <Text className="text-xs font-semibold text-rose-300 flex-1">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Form Inputs */}
            <View className="gap-3.5">
              {/* Full Name */}
              <View>
                <Text className="text-[11px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Full Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#211C2B',
                    borderColor: '#2E273B',
                    color: '#FFFFFF',
                  }}
                  className="w-full border rounded-2xl px-4 py-3.5 text-white text-xs font-medium focus:border-[#9D84D6]"
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor="#7C7389"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    setErrorMessage(null);
                  }}
                />
              </View>

              {/* Email Address */}
              <View>
                <Text className="text-[11px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Email Address
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#211C2B',
                    borderColor: '#2E273B',
                    color: '#FFFFFF',
                  }}
                  className="w-full border rounded-2xl px-4 py-3.5 text-white text-xs font-medium focus:border-[#9D84D6]"
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

              {/* Password */}
              <View>
                <Text className="text-[11px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Password
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    style={{
                      backgroundColor: '#211C2B',
                      borderColor: '#2E273B',
                      color: '#FFFFFF',
                    }}
                    className="w-full border rounded-2xl px-4 py-3.5 pr-12 text-white text-xs font-medium focus:border-[#9D84D6]"
                    placeholder="At least 6 characters"
                    placeholderTextColor="#7C7389"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMessage(null);
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 p-1 items-center justify-center"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Text className="text-xs text-[#9E98A8] font-bold">
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-[11px] font-bold text-[#9D84D6] uppercase tracking-wider mb-1.5">
                  Confirm Password
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    style={{
                      backgroundColor: '#211C2B',
                      borderColor: '#2E273B',
                      color: '#FFFFFF',
                    }}
                    className="w-full border rounded-2xl px-4 py-3.5 pr-12 text-white text-xs font-medium focus:border-[#9D84D6]"
                    placeholder="Re-enter your password"
                    placeholderTextColor="#7C7389"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      setErrorMessage(null);
                    }}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 p-1 items-center justify-center"
                    accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Text className="text-xs text-[#9E98A8] font-bold">
                      {showConfirmPassword ? 'HIDE' : 'SHOW'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Register Button */}
              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                accessibilityRole="button"
                style={{
                  backgroundColor: isLoading ? '#372D4A' : '#4A3C63',
                  borderColor: '#9D84D6',
                }}
                className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md mt-1"
              >
                <Text className="text-white text-sm font-bold tracking-wide">
                  {isLoading ? 'Creating Account...' : 'Create Account ➔'}
                </Text>
              </Pressable>
            </View>

            {/* SSO / Divider */}
            <View className="w-full gap-3 pt-3">
              <View className="flex-row items-center my-1.5">
                <View style={{ backgroundColor: '#2E273B' }} className="flex-1 h-[1px]" />
                <Text className="text-[10px] font-bold text-[#7C7389] px-3 uppercase tracking-wider">
                  or
                </Text>
                <View style={{ backgroundColor: '#2E273B' }} className="flex-1 h-[1px]" />
              </View>

              {/* Continue with Google */}
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
            </View>
          </View>

          {/* Footer Navigation: Link to Login Screen */}
          <View className="items-center pt-3 pb-1">
            <Pressable
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              className="py-2 px-4"
            >
              <Text className="text-xs text-[#9E98A8]">
                Already have an account?{' '}
                <Text style={{ color: '#9D84D6' }} className="font-bold underline">
                  Sign In
                </Text>
              </Text>
            </Pressable>

            <Text className="text-[10px] text-[#7C7389] mt-1 text-center">
              🔒 100% On-Device • Zero trackers • Private to your phone
            </Text>
          </View>
        </ScrollView>
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
