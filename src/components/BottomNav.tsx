import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'home' | 'reports' | 'schedule' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  // Safe clearance for Android 3-button navigation (||| O <) and gesture bar
  const bottomInsetPadding = Math.max(insets.bottom, 12) + 8;

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <View
      style={{
        backgroundColor: '#16131D',
        borderTopColor: '#2D273A',
        paddingBottom: bottomInsetPadding,
        paddingTop: 10,
      }}
      className="border-t flex-row justify-around items-center px-3"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? '#9D84D6' : '#7C7389';

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="items-center justify-center py-1 px-3 flex-1"
          >
            {/* Render Tab Icon */}
            <View className="w-6 h-6 items-center justify-center mb-1">
              {tab.id === 'home' && <HomeIcon color={color} />}
              {tab.id === 'reports' && <ReportsIcon color={color} />}
              {tab.id === 'schedule' && <ScheduleIcon color={color} />}
              {tab.id === 'settings' && <SettingsIcon color={color} />}
            </View>

            {/* Label */}
            <Text
              style={{ color }}
              className={`text-[11px] font-semibold tracking-tight ${
                isActive ? 'font-bold' : ''
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// 1. Home Icon (Clean outline house with door)
function HomeIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-end">
      {/* Roof peak */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 9,
          borderRightWidth: 9,
          borderBottomWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      {/* House Body */}
      <View
        style={{
          width: 14,
          height: 10,
          borderWidth: 1.8,
          borderColor: color,
          borderTopWidth: 0,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* Door */}
        <View
          style={{
            width: 4,
            height: 5,
            backgroundColor: color,
            borderTopLeftRadius: 1,
            borderTopRightRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

// 2. Reports Icon (3 distinct bar chart columns)
function ReportsIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 flex-row items-end justify-between px-0.5 pb-0.5">
      {/* Left bar */}
      <View
        style={{
          width: 3.5,
          height: 10,
          backgroundColor: color,
          borderRadius: 1.5,
        }}
      />
      {/* Center bar */}
      <View
        style={{
          width: 3.5,
          height: 16,
          backgroundColor: color,
          borderRadius: 1.5,
        }}
      />
      {/* Right bar */}
      <View
        style={{
          width: 3.5,
          height: 13,
          backgroundColor: color,
          borderRadius: 1.5,
        }}
      />
    </View>
  );
}

// 3. Schedule Icon (Calendar with top loops and date grid)
function ScheduleIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      {/* Top hanger loops */}
      <View className="flex-row justify-between w-3.5 mb-[-2px] z-10">
        <View style={{ width: 1.8, height: 3, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 1.8, height: 3, backgroundColor: color, borderRadius: 1 }} />
      </View>

      {/* Calendar body */}
      <View
        style={{
          width: 16,
          height: 14,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 3,
          padding: 1.5,
          justifyContent: 'space-around',
        }}
      >
        <View className="flex-row justify-around">
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
        </View>
        <View className="flex-row justify-around">
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    </View>
  );
}

// 4. Settings Icon (Gear with center hub and teeth)
function SettingsIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      {/* Outer Gear Outline */}
      <View
        style={{
          width: 15,
          height: 15,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 7.5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Center circle hub */}
        <View
          style={{
            width: 4,
            height: 4,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </View>
      {/* 4 Gear Teeth Cross */}
      <View
        style={{
          position: 'absolute',
          width: 17,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 2,
          height: 17,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}
