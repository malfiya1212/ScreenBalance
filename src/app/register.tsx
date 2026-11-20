import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '@/context/AppContext';
import ScreenBalanceLogo from '@/components/ScreenBalanceLogo';
import GoogleGLogo from '@/components/GoogleGLogo';
import { authStyles as styles } from '@/styles';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefillEmail?: string }>();
  const { registerAccount, doesEmailExist, setUser } = useApp();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(params.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleRegister = () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      setEmailAlreadyExists(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      setEmailAlreadyExists(false);
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. name@domain.com)');
      setEmailAlreadyExists(false);
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter a password.');
      setEmailAlreadyExists(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Please enter at least 6 characters for your password.');
      setEmailAlreadyExists(false);
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      setEmailAlreadyExists(false);
      return;
    }

    // Check if email already exists
    if (doesEmailExist(cleanEmail)) {
      setErrorMessage('An account with this email already exists. Please sign in instead.');
      setEmailAlreadyExists(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setEmailAlreadyExists(false);

    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    setTimeout(() => {
      const result = registerAccount({
        name: formattedName,
        email: cleanEmail,
        password: cleanPassword,
      });

      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to register account.');
        return;
      }

      // CRITICAL: Do NOT go directly to permissions!
      // Redirect to login screen so user must first authenticate with their email and password.
      router.replace({
        pathname: '/login',
        params: {
          registeredEmail: cleanEmail,
        },
      });
    }, 250);
  };

  const handleContinueWithGoogle = async () => {
    try {
      setIsLoading(true);
      await WebBrowser.openBrowserAsync('https://accounts.google.com/signin/v2/identifier');

      setUser({
        name: 'Google User',
        email: 'user@gmail.com',
      });
      setIsLoading(false);
      router.replace('/permissions');
    } catch {
      setIsLoading(false);
      Alert.alert('Google Sign-In', 'Could not open Google Sign-In.');
    }
  };

  const bottomPadding = Math.max(insets.bottom, 20);

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6 py-3"
        >
          {/* Constrained Card Container */}
          <View style={styles.cardContainer} className="flex-1 justify-between self-center">
            {/* Top Bar: Back Button */}
            <View className="flex-row items-center justify-between mb-1">
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back to login"
                style={styles.backButton}
                className="w-10 h-10 rounded-full border items-center justify-center active:bg-[#2B234D]"
              >
                <Text className="text-white text-lg font-bold">←</Text>
              </Pressable>
              <View className="w-10" />
            </View>

            {/* Tight Header Block */}
            <View className="items-center mt-1 mb-3">
              <ScreenBalanceLogo size={58} showGlow={true} />

              <Text className="text-2xl font-black text-white tracking-tight text-center mt-2 mb-0.5">
                ScreenBalance
              </Text>
              <Text style={styles.subtitle} className="text-xs font-medium text-center">
                Create your account
              </Text>
            </View>

            {/* Registration Form */}
            <View className="w-full flex-1 justify-center py-1">
              {/* Error Banner */}
              {errorMessage && (
                <View
                  style={styles.errorBanner}
                  className="border p-3.5 rounded-2xl mb-3 gap-2"
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-sm">⚠️</Text>
                    <Text className="text-xs font-semibold text-rose-300 flex-1">
                      {errorMessage}
                    </Text>
                  </View>
                  {emailAlreadyExists && (
                    <Pressable
                      onPress={() =>
                        router.replace({
                          pathname: '/login',
                          params: { registeredEmail: email.trim().toLowerCase() },
                        })
                      }
                      className="bg-rose-950/60 border border-rose-800/80 py-2 px-3 rounded-xl items-center mt-1"
                    >
                      <Text className="text-rose-200 text-xs font-bold">
                        Sign In to Existing Account ➔
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View className="gap-2.5">
                {/* Full Name */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                >
                  <Text className="text-base text-[#948BA8]">👤</Text>
                  <TextInput
                    style={styles.inputText}
                    className="flex-1 font-medium"
                    placeholder="Full Name"
                    placeholderTextColor="#7E7599"
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      setErrorMessage(null);
                      setEmailAlreadyExists(false);
                    }}
                  />
                </View>

                {/* Email Address */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                >
                  <Text className="text-base text-[#948BA8]">✉️</Text>
                  <TextInput
                    style={styles.inputText}
                    className="flex-1 font-medium"
                    placeholder="Email Address"
                    placeholderTextColor="#7E7599"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      setErrorMessage(null);
                      setEmailAlreadyExists(false);
                    }}
                  />
                </View>

                {/* Password */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                >
                  <Text className="text-base text-[#948BA8]">🔒</Text>
                  <TextInput
                    style={styles.inputText}
                    className="flex-1 font-medium"
                    placeholder="Password"
                    placeholderTextColor="#7E7599"
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
                    hitSlop={10}
                    className="p-1 items-center justify-center"
                  >
                    <Text className="text-sm text-[#948BA8]">
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </Pressable>
                </View>

                {/* Confirm Password */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3 flex-row items-center gap-3"
                >
                  <Text className="text-base text-[#948BA8]">🔒</Text>
                  <TextInput
                    style={styles.inputText}
                    className="flex-1 font-medium"
                    placeholder="Confirm Password"
                    placeholderTextColor="#7E7599"
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
                    hitSlop={10}
                    className="p-1 items-center justify-center"
                  >
                    <Text className="text-sm text-[#948BA8]">
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </Pressable>
                </View>

                {/* Primary Action Button: Create Account */}
                <Pressable
                  onPress={handleRegister}
                  disabled={isLoading}
                  accessibilityRole="button"
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  className="w-full border py-3.5 rounded-2xl items-center justify-center active:opacity-90 mt-1"
                >
                  <Text className="text-white text-base font-extrabold tracking-wide">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </Pressable>
              </View>

              {/* Social SSO Section */}
              <View className="w-full gap-2 pt-2.5">
                <View className="flex-row items-center my-1.5">
                  <View style={styles.dividerLine} className="flex-1 h-[1px]" />
                  <Text className="text-xs font-bold text-[#7E7599] px-3 uppercase tracking-wider">
                    OR
                  </Text>
                  <View style={styles.dividerLine} className="flex-1 h-[1px]" />
                </View>

                {/* Continue with Google */}
                <Pressable
                  onPress={handleContinueWithGoogle}
                  accessibilityRole="button"
                  style={styles.googleButton}
                  className="w-full border py-3 rounded-2xl items-center justify-center flex-row active:bg-[#1E1738]"
                >
                  <GoogleGLogo size={18} />
                  <Text className="text-white text-sm font-bold tracking-tight">
                    Continue with Google
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Footer Navigation: Link to Login Screen */}
            <View className="items-center mt-6 pt-3 pb-1">
              <Pressable
                onPress={() => router.push('/login')}
                accessibilityRole="button"
                className="py-2 px-4"
              >
                <Text className="text-xs text-[#948BA8]">
                  Already have an account?{' '}
                  <Text style={styles.linkHighlight} className="font-bold underline">
                    Sign In
                  </Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
