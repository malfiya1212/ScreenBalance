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
  const bottomInsetPadding = Math.max(insets.bottom, 10) + 6;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <View
      style={[styles.container, { paddingBottom: bottomInsetPadding }]}
      className="flex-row justify-around items-center px-4"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? '#A78BFA' : '#8E87A3';

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="items-center justify-center py-1.5 px-3 flex-1 active:opacity-75"
          >
            {/* Render Tab Icon */}
            <View style={styles.iconBox}>
              {tab.id === 'home' && <HomeIcon color={color} />}
              {tab.id === 'reports' && <ReportsIcon color={color} />}
              {tab.id === 'schedule' && <ScheduleIcon color={color} />}
              {tab.id === 'settings' && <SettingsIcon color={color} />}
            </View>

            {/* Label */}
            <Text
              style={isActive ? styles.labelActive : styles.labelInactive}
              className="mt-1 tracking-tight"
            >
              {tab.label}
            </Text>

            {/* Active Glow Pill */}
            {isActive ? (
              <View style={styles.activeIndicator} />
            ) : (
              <View style={styles.activeIndicatorPlaceholder} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// 1. Home Icon (Clean outline house with door)
function HomeIcon({ color }: { color: string }) {
  return (
    <View className="items-center justify-end">
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
    <View style={styles.reportsContainer}>
      <View style={[styles.barColumn, styles.barLeft, { backgroundColor: color }]} />
      <View style={[styles.barColumn, styles.barCenter, { backgroundColor: color }]} />
      <View style={[styles.barColumn, styles.barRight, { backgroundColor: color }]} />
    </View>
  );
}

// 3. Schedule Icon (Calendar frame with top rings and day dots)
function ScheduleIcon({ color }: { color: string }) {
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarRingsRow}>
        <View style={[styles.hangerLoop, { backgroundColor: color }]} />
        <View style={[styles.hangerLoop, { backgroundColor: color }]} />
      </View>
      <View style={[styles.calendarBody, { borderColor: color }]}>
        <View style={styles.calendarDotsRow}>
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
        </View>
        <View style={styles.calendarDotsRow}>
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
          <View style={[styles.calendarDot, { backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

// 4. Settings Icon (Gear with hub and teeth)
function SettingsIcon({ color }: { color: string }) {
  return (
    <View style={styles.gearContainer}>
      <View style={[styles.gearToothHorizontal, { backgroundColor: color }]} />
      <View style={[styles.gearToothVertical, { backgroundColor: color }]} />
      <View style={[styles.gearOutline, { borderColor: color }]}>
        <View style={[styles.gearHub, { backgroundColor: color }]} />
      </View>
    </View>
  );
}
