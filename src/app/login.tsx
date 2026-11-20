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

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registeredEmail?: string }>();
  const { loginAccount, setUser } = useApp();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState(params.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleLogin = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      setAccountNotFound(false);
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. name@domain.com)');
      setAccountNotFound(false);
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      setAccountNotFound(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Please enter at least 6 characters for your password.');
      setAccountNotFound(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAccountNotFound(false);

    setTimeout(() => {
      const result = loginAccount({
        email: cleanEmail,
        password: cleanPassword,
      });

      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed.');
        if (result.error?.includes('No account found')) {
          setAccountNotFound(true);
        }
        return;
      }

      // Login successful! Only with valid credentials is user given access
      router.replace('/permissions');
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
      Alert.alert('Google Sign-In', 'Could not open Google Sign-In. Please check your connection.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleGoToRegister = () => {
    router.push({
      pathname: '/register',
      params: { prefillEmail: email.trim().toLowerCase() },
    });
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
          <View style={styles.cardContainer} className="flex-1 justify-between self-center">
            {/* Top Bar: Back Button */}
            <View className="flex-row items-center justify-between mb-1">
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backButton}
                className="w-10 h-10 rounded-full border items-center justify-center active:bg-[#2B234D]"
              >
                <Text className="text-white text-base font-bold">←</Text>
              </Pressable>
              <View className="w-10" />
            </View>

            {/* Header Block */}
            <View className="items-center mt-1 mb-3">
              <ScreenBalanceLogo size={60} showGlow={true} />

              <Text className="text-2xl font-black text-white tracking-tight text-center mt-2.5 mb-0.5">
                ScreenBalance
              </Text>
              <Text style={styles.subtitle} className="text-xs font-medium text-center">
                Sign in to continue
              </Text>
            </View>

            {/* Error Message Banner */}
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
                {accountNotFound && (
                  <Pressable
                    onPress={handleGoToRegister}
                    className="bg-rose-950/60 border border-rose-800/80 py-2 px-3 rounded-xl items-center mt-1"
                  >
                    <Text className="text-rose-200 text-xs font-bold">
                      Create an Account Now ➔
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Form Section */}
            <View className="w-full flex-1 justify-center py-1">
              <View className="gap-3">
                {/* Email Field */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3.5 flex-row items-center gap-3"
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
                      setAccountNotFound(false);
                    }}
                  />
                </View>

                {/* Password Field */}
                <View
                  style={styles.inputWrapper}
                  className="border rounded-2xl px-4 py-3.5 flex-row items-center gap-3"
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

                {/* Forgot Password Link */}
                <View className="items-end pt-0.5 mb-1">
                  <Pressable onPress={handleForgotPassword} hitSlop={8}>
                    <Text className="text-xs font-semibold text-[#A78BFA] active:text-white">
                      Forgot Password?
                    </Text>
                  </Pressable>
                </View>

                {/* Primary Action Button: Sign In */}
                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  accessibilityRole="button"
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  className="w-full border py-3.5 rounded-2xl items-center justify-center active:opacity-90 mt-1"
                >
                  <Text className="text-white text-base font-extrabold tracking-wide">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>

              {/* Alternative Auth Option: Google Sign-In */}
              <View className="w-full gap-2.5 pt-3">
                <View className="flex-row items-center my-2">
                  <View style={styles.dividerLine} className="flex-1 h-[1px]" />
                  <Text className="text-xs font-bold text-[#7E7599] px-3 uppercase tracking-wider">
                    OR
                  </Text>
                  <View style={styles.dividerLine} className="flex-1 h-[1px]" />
                </View>

                {/* Continue with Google Button */}
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

            {/* Footer Navigation */}
            <View className="items-center mt-6 pt-3 pb-1">
              <Pressable
                onPress={handleGoToRegister}
                accessibilityRole="button"
                className="py-2 px-4"
              >
                <Text className="text-xs text-[#948BA8]">
                  {"Don't have an account? "}
                  <Text style={styles.linkHighlight} className="font-bold underline">
                    Create Account
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
