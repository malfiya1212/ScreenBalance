import ScreenBalanceLogo from '@/components/ScreenBalanceLogo';
import { useApp } from '@/context/AppContext';
import { authStyles as styles } from '@/styles';
import { openEmailClient } from '@/utils/emailClient';
import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { doesEmailExist, resetPassword } = useApp();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const handleSendResetEmail = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      setEmailNotFound(false);
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email format (e.g. name@domain.com)');
      setEmailNotFound(false);
      return;
    }

    // Verify email existence ("if exist email")
    if (!doesEmailExist(cleanEmail)) {
      setErrorMessage('No account found with this email. Please check your spelling or register.');
      setEmailNotFound(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setEmailNotFound(false);

    setTimeout(() => {
      resetPassword(cleanEmail);
      setIsLoading(false);
      setIsSuccess(true);
    }, 400);
  };

  const handleOpenEmail = async () => {
    const res = await openEmailClient(email);
    if (!res.success && res.message) {
      Alert.alert('Email Client', res.message);
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

            {/* Tight Header */}
            <View className="items-center mt-1 mb-4">
              <ScreenBalanceLogo size={60} showGlow={true} />

              <Text className="text-2xl font-black text-white tracking-tight text-center mt-2.5 mb-0.5">
                ScreenBalance
              </Text>
              <Text style={styles.subtitle} className="text-xs font-medium text-center">
                Reset your password
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
                {emailNotFound && (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/register',
                        params: { prefillEmail: email.trim().toLowerCase() },
                      })
                    }
                    className="bg-rose-950/60 border border-rose-800/80 py-2 px-3 rounded-xl items-center mt-1"
                  >
                    <Text className="text-rose-200 text-xs font-bold">
                      Create an Account ➔
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Middle Section: Instructions & Form */}
            <View className="w-full flex-1 justify-center py-2">
              {isSuccess ? (
                /* Success State */
                <View
                  style={styles.successCard}
                  className="border p-5 rounded-3xl items-center gap-3.5 my-2 shadow-xl"
                >
                  <View
                    style={styles.successCheckBadge}
                    className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
                  >
                    <Text className="text-white text-2xl font-bold">✓</Text>
                  </View>

                  <Text className="text-xl font-black text-white text-center">
                    Check Your Email
                  </Text>

                  <Text
                    style={styles.successEmailNotice}
                    className="text-xs text-center leading-relaxed"
                  >
                    We sent password reset instructions to:{'\n'}
                    <Text className="font-bold text-white text-sm">{email}</Text>
                  </Text>

                  <Text className="text-xs text-[#7E7599] text-center mt-1 px-2">
                    Please check your inbox or spam folder, then sign in with your updated credentials.
                  </Text>

                  {/* Action 1: Go to Email */}
                  <Pressable
                    onPress={handleOpenEmail}
                    accessibilityRole="button"
                    style={styles.emailActionButton}
                    className="w-full border py-3.5 rounded-2xl items-center justify-center flex-row gap-2 active:opacity-85 mt-2"
                  >
                    <Text className="text-base">📬</Text>
                    <Text className="text-white text-sm font-bold">
                      Go to Email (Open Mail App)
                    </Text>
                  </Pressable>

                  {/* Action 2: Return to Sign In */}
                  <Pressable
                    onPress={() =>
                      router.replace({
                        pathname: '/login',
                        params: { registeredEmail: email },
                      })
                    }
                    style={styles.returnButton}
                    className="w-full border py-3.5 rounded-2xl items-center justify-center active:opacity-90"
                  >
                    <Text className="text-white text-sm font-bold">
                      Return to Sign In ➔
                    </Text>
                  </Pressable>
                </View>
              ) : (
                /* Form State */
                <View className="gap-3.5">
                  <Text
                    style={styles.instructionText}
                    className="text-xs text-center px-4 leading-relaxed"
                  >
                    Enter your registered email address and we will provide your reset instructions.
                  </Text>

                  {/* Email Input */}
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
                        setEmailNotFound(false);
                      }}
                    />
                  </View>

                  {/* Send Email Action Button */}
                  <Pressable
                    onPress={handleSendResetEmail}
                    disabled={isLoading}
                    accessibilityRole="button"
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    className="w-full border py-3.5 rounded-2xl items-center justify-center active:opacity-90 mt-1"
                  >
                    <Text className="text-white text-base font-extrabold tracking-wide">
                      {isLoading ? 'Verifying Email...' : 'Send Reset Link'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Footer Navigation */}
            <View className="items-center pt-3 pb-2">
              <Pressable
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                className="py-2 px-4"
              >
                <Text className="text-xs text-[#948BA8]">
                  Remember your password?{' '}
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
