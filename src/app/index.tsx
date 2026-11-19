import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import ScreenBalanceLogo from '@/components/ScreenBalanceLogo';
import { welcomeStyles as styles } from '@/styles';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 24);

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        className="px-6 py-4"
      >
        <View className="items-center mt-3">
          <View className="mb-4">
            <ScreenBalanceLogo size={64} showGlow={true} />
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight text-center mb-2.5">
            ScreenBalance
          </Text>
          <Text style={styles.subtitle} className="font-medium text-center px-2 max-w-[340px]">
            Take control of your screen time, set healthy app limits, and build better digital habits.
          </Text>
        </View>

        {/* Visual Hero Center Graphic */}
        <View className="items-center justify-center my-6 flex-1">
          <View style={styles.graphicContainer}>
            {/* Ambient Background Glow */}
            <View style={styles.ambientGlow} />

            {/* Floating Left Badge: Clock */}
            <View
              style={styles.floatingBadgeLeft}
              className="w-12 h-12 rounded-full border items-center justify-center"
            >
              <Text className="text-lg">🕒</Text>
            </View>

            {/* Central Phone Mock Frame */}
            <View style={styles.phoneFrame}>
              {/* Phone Speaker Notch */}
              <View style={styles.phoneNotch} />

              {/* Inner Glowing Screen with Custom Logo */}
              <View style={styles.phoneInnerScreen}>
                <ScreenBalanceLogo size={52} showGlow={false} />
              </View>
            </View>

            {/* Floating Right Badge: Analytics Graph */}
            <View
              style={styles.floatingBadgeRight}
              className="w-12 h-12 rounded-full border items-center justify-center"
            >
              <Text className="text-lg">📊</Text>
            </View>
          </View>
        </View>

        {/* Bottom Prominent Action Button: Get Started -> /login */}
        <View className="w-full pt-3 pb-2">
          <Pressable
            onPress={() => {
              if (user) {
                router.replace('/dashboard');
              } else {
                router.push('/login');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            style={styles.primaryButton}
            className="w-full py-4 rounded-2xl items-center justify-center active:opacity-90"
          >
            <Text className="text-white text-base font-extrabold tracking-wide">
              Get Started ➔
            </Text>
          </Pressable>

          {/* Secondary Link: Learn More */}
          <Pressable
            onPress={() => setShowLearnMore(true)}
            className="py-3 items-center mt-1"
          >
            <Text className="text-xs font-semibold text-[#8B7BA8] active:text-white">
              Learn More
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Learn More Modal Sheet */}
      <Modal
        visible={showLearnMore}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLearnMore(false)}
      >
        <View className="flex-1 bg-black/75 justify-end">
          <View style={styles.modalSheet} className="px-6 pt-5 pb-8 rounded-t-3xl">
            <View className="items-center mb-4">
              <View style={styles.modalHandle} className="w-10 h-1 rounded-full mb-3" />
              <Text className="text-lg font-bold text-white">About ScreenBalance</Text>
            </View>
            <Text className="text-xs text-[#948BA8] leading-relaxed mb-4 text-center">
              ScreenBalance helps you regain mindfulness over digital habits through non-invasive, 100% on-device monitoring.
            </Text>
            <View className="gap-2.5 mb-5">
              <Text className="text-xs text-white">
                🔒 <Text className="font-bold">100% Private:</Text> Your app usage data stays exclusively on your phone.
              </Text>
              <Text className="text-xs text-white">
                🛡️ <Text className="font-bold">Granular Shields:</Text> Stop endless video feeds while retaining messaging.
              </Text>
              <Text className="text-xs text-white">
                ⏱️ <Text className="font-bold">Shared Caps:</Text> Group distracting apps under unified budgets.
              </Text>
            </View>
            <Pressable
              onPress={() => setShowLearnMore(false)}
              style={styles.modalCloseButton}
              className="py-3.5 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
