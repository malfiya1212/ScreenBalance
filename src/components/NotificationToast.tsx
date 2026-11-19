import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';

export default function NotificationToast() {
  const insets = useSafeAreaInsets();
  const { activeToast, dismissToast } = useApp();

  if (!activeToast) return null;

  const getBorderColor = () => {
    switch (activeToast.severity) {
      case 'critical':
        return '#EF4444';
      case 'urgent':
        return '#F59E0B';
      case 'warning':
        return '#9D84D6';
      case 'info':
      default:
        return '#38BDF8';
    }
  };

  const getBadgeStyle = () => {
    switch (activeToast.severity) {
      case 'critical':
        return { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300' };
      case 'urgent':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300' };
      case 'warning':
        return { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300' };
      case 'info':
      default:
        return { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-300' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: Math.max(insets.top + 8, 16),
        left: 16,
        right: 16,
        zIndex: 99999,
        elevation: 10,
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={dismissToast}
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#1E1634',
          borderColor: getBorderColor(),
          borderWidth: 1.5,
          borderRadius: 20,
          padding: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        }}
        accessibilityRole="alert"
        accessibilityLabel={activeToast.title}
        className="active:opacity-90"
      >
        <View className="flex-row items-start justify-between mb-1.5">
          <View className="flex-row items-center gap-2 flex-1 pr-2">
            <View
              className={`px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border}`}
            >
              <Text className={`text-[10px] font-black uppercase tracking-wider ${badge.text}`}>
                {activeToast.severity}
              </Text>
            </View>
            <Text className="text-sm font-extrabold text-white flex-1" numberOfLines={1}>
              {activeToast.title}
            </Text>
          </View>

          <Pressable
            onPress={dismissToast}
            hitSlop={10}
            className="w-6 h-6 rounded-full bg-[#2E224D] items-center justify-center active:bg-[#433270]"
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <Text className="text-xs text-[#A69FC0] font-bold">✕</Text>
          </Pressable>
        </View>

        <Text className="text-xs text-[#D8D2E7] font-medium leading-relaxed pl-1">
          {activeToast.message}
        </Text>

        <View className="flex-row items-center justify-between mt-2 pt-1.5 border-t border-[#312552] pl-1">
          <Text className="text-[10px] font-semibold text-[#8C83A4]">
            App: <Text className="text-white font-bold">{activeToast.appName}</Text> •{' '}
            {activeToast.remainingMinutes <= 0
              ? 'Limit Reached'
              : `${activeToast.remainingMinutes}m remaining`}
          </Text>
          <Text className="text-[10px] text-[#A69FC0]">Tap to dismiss</Text>
        </View>
      </Pressable>
    </View>
  );
}
