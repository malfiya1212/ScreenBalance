import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bottomNavStyles as styles } from '@/styles';

export type TabType = 'home' | 'reports' | 'schedule' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  // Safe clearance for Android 3-button navigation (||| O <) and gesture bar
  const bottomInsetPadding = Math.max(insets.bottom, 12) + 8;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <View
      style={[styles.container, { paddingBottom: bottomInsetPadding }]}
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
              style={isActive ? styles.labelActive : styles.labelInactive}
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
        style={[
          styles.homeRoof,
          { borderBottomColor: color },
        ]}
      />
      {/* House Body */}
      <View
        style={[
          styles.homeBody,
          { borderColor: color },
        ]}
      >
        {/* Door */}
        <View
          style={[
            styles.homeDoor,
            { backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

// 2. Reports Icon (3 distinct bar chart columns)
function ReportsIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 flex-row items-end justify-between px-0.5 pb-0.5">
      <View style={[styles.barColumn, styles.barLeft, { backgroundColor: color }]} />
      <View style={[styles.barColumn, styles.barCenter, { backgroundColor: color }]} />
      <View style={[styles.barColumn, styles.barRight, { backgroundColor: color }]} />
    </View>
  );
}

// 3. Schedule Icon (Calendar with top loops and date grid)
function ScheduleIcon({ color }: { color: string }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      {/* Top hanger loops */}
      <View className="flex-row justify-between w-3.5 mb-[-2px] z-10">
        <View style={[styles.hangerLoop, { backgroundColor: color }]} />
        <View style={[styles.hangerLoop, { backgroundColor: color }]} />
      </View>

      {/* Calendar body */}
      <View
        style={[
          styles.calendarBody,
          { borderColor: color },
        ]}
      >
        <View className="flex-row justify-around">
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
        </View>
        <View className="flex-row justify-around">
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
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
        style={[
          styles.gearOutline,
          { borderColor: color },
        ]}
      >
        {/* Center circle hub */}
        <View style={[styles.gearHub, { backgroundColor: color }]} />
      </View>
      {/* 4 Gear Teeth Cross */}
      <View style={[styles.gearToothHorizontal, { backgroundColor: color }]} />
      <View style={[styles.gearToothVertical, { backgroundColor: color }]} />
    </View>
  );
}
