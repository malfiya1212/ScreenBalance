import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const insets = useSafeAreaInsets();

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
          {/* Multi-color ring logo */}
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

        {/* Action Buttons: Register & Login Navigation */}
        <View className="w-full gap-3 pt-2">
          {user ? (
            <Pressable
              onPress={() => router.replace('/dashboard')}
              accessibilityRole="button"
              style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
              className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
            >
              <Text className="text-white text-base font-extrabold tracking-wide">
                Continue as {user.name} ➔
              </Text>
            </Pressable>
          ) : (
            <>
              {/* Primary Action: Register */}
              <Pressable
                onPress={() => router.push('/register')}
                accessibilityRole="button"
                style={{ backgroundColor: '#4A3C63', borderColor: '#9D84D6' }}
                className="w-full border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-md"
              >
                <Text className="text-white text-base font-extrabold tracking-wide">
                  Get Started (Register) ➔
                </Text>
              </Pressable>

              {/* Secondary Action: Login */}
              <Pressable
                onPress={() => router.push('/login')}
                accessibilityRole="button"
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="w-full border py-3.5 rounded-2xl items-center justify-center active:bg-[#2D263B]"
              >
                <Text className="text-white text-sm font-bold tracking-tight">
                  I Already Have an Account (Sign In)
                </Text>
              </Pressable>

              {/* Quick SSO: Google */}
              <Pressable
                onPress={handleContinueWithGoogle}
                accessibilityRole="button"
                style={{ backgroundColor: '#211C2B', borderColor: '#2E273B' }}
                className="w-full border py-3 rounded-2xl items-center justify-center flex-row active:bg-[#2A2436] mt-1"
              >
                <GoogleGLogo />
                <Text className="text-[#9E98A8] text-xs font-semibold">
                  Quick start with Google
                </Text>
              </Pressable>
            </>
          )}

          <Text className="text-center text-[10px] text-[#7C7389] mt-1">
            🔒 100% On-Device • No backend servers • Private to your phone
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Google 4-Color 'G' Logo
function GoogleGLogo() {
  return (
    <View className="w-4 h-4 mr-2 items-center justify-center">
      <View
        style={{
          width: 15,
          height: 15,
          borderRadius: 7.5,
          borderWidth: 1.8,
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
            width: 6,
            height: 1.8,
            backgroundColor: '#4285F4',
          }}
        />
      </View>
    </View>
  );
}
