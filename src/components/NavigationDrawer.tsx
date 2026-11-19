import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { navigationDrawerStyles as styles } from '@/styles';

export type DrawerModule =
  | 'home'
  | 'limits'
  | 'in-app-blocking'
  | 'notifications'
  | 'level'
  | 'insights'
  | 'friends'
  | 'desktop'
  | 'inbox'
  | 'categories'
  | 'settings';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: DrawerModule;
  onSelectModule: (module: DrawerModule) => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  activeModule,
  onSelectModule,
}: NavigationDrawerProps) {
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row bg-black/75">
        {/* Slide-out Drawer Panel (Dark Plum Background matching reference) */}
        <SafeAreaView
          style={styles.drawerPanel}
          className="w-[82%] max-w-[325px] h-full shadow-2xl justify-between"
          edges={['top', 'bottom']}
        >
          {/* Scrollable Menu Items */}
          <ScrollView className="flex-1 px-4 pt-3" showsVerticalScrollIndicator={false}>
            {/* Drawer Header matching reference: Logo + Name + "• Follow us!" */}
            <View className="flex-row items-center justify-between pb-3.5 mb-2 border-b border-[#2D273A]">
              <View className="flex-row items-center gap-2.5">
                {/* Checkmark Circle Icon */}
                <View className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 via-amber-300 to-rose-400 items-center justify-center p-[2px]">
                  <View className="w-full h-full rounded-full bg-[#211C2B] items-center justify-center">
                    <Text className="text-xs font-black text-[#9D84D6]">✓</Text>
                  </View>
                </View>

                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-base font-extrabold text-white tracking-tight">
                    ScreenBalance
                  </Text>
                  <Text className="text-xs font-semibold text-[#9D84D6]">
                    • Follow us!
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={10}
                className="w-7 h-7 rounded-full bg-[#2D273A] items-center justify-center active:bg-[#393247]"
              >
                <Text className="text-xs font-bold text-[#9E98A8]">✕</Text>
              </Pressable>
            </View>

            {/* Menu Group 1: Core System */}
            <View className="gap-1 mb-2">
              <DrawerItem
                icon="🏠"
                label="Home"
                isActive={activeModule === 'home'}
                onPress={() => {
                  onSelectModule('home');
                  onClose();
                }}
              />
              <DrawerItem
                icon="📈"
                label="Usage Limits"
                isActive={activeModule === 'limits'}
                onPress={() => {
                  onSelectModule('limits');
                  onClose();
                }}
              />
              <DrawerItem
                icon="⁝⁝⁝"
                label="In-App Blocking"
                isActive={activeModule === 'in-app-blocking'}
                onPress={() => {
                  onSelectModule('in-app-blocking');
                  onClose();
                }}
              />
              <DrawerItem
                icon="🔔"
                label="Usage Notifications"
                isActive={activeModule === 'notifications'}
                onPress={() => {
                  onSelectModule('notifications');
                  onClose();
                }}
              />
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-[#2E273B] my-2" />

            {/* Menu Group 2: Features & Insights */}
            <View className="gap-1 mb-2">
              <DrawerItem
                icon="🏆"
                label="Level"
                isActive={activeModule === 'level'}
                onPress={() => {
                  onSelectModule('level');
                  onClose();
                }}
              />
              <DrawerItem
                icon="🌐"
                label="Usage Insights"
                badgeText="New"
                isActive={activeModule === 'insights'}
                onPress={() => {
                  onSelectModule('insights');
                  onClose();
                }}
              />
              <DrawerItem
                icon="👥"
                label="My Friends"
                isActive={activeModule === 'friends'}
                onPress={() => {
                  onSelectModule('friends');
                  onClose();
                }}
              />
              <DrawerItem
                icon="💻"
                label="ScreenBalance for Desktop"
                isActive={activeModule === 'desktop'}
                onPress={() => {
                  onSelectModule('desktop');
                  onClose();
                }}
              />
              <DrawerItem
                icon="✉️"
                label="Inbox Control"
                isActive={activeModule === 'inbox'}
                onPress={() => {
                  onSelectModule('inbox');
                  onClose();
                }}
              />
            </View>

            {/* Divider */}
            <View className="h-[1px] bg-[#2E273B] my-2" />

            {/* Menu Group 3: Categories & Settings */}
            <View className="gap-1 mb-6">
              <DrawerItem
                icon="▲"
                label="Categories"
                isActive={activeModule === 'categories'}
                onPress={() => {
                  onSelectModule('categories');
                  onClose();
                }}
              />
              <DrawerItem
                icon="⚙️"
                label="Settings"
                isActive={activeModule === 'settings'}
                onPress={() => {
                  onSelectModule('settings');
                  onClose();
                }}
              />
            </View>
          </ScrollView>

          {/* User Profile Card Footer matching reference exactly */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 12) + 6 },
            ]}
            className="px-4 pt-3 border-t border-[#2D273A] flex-row items-center gap-3"
          >
            {/* Custom Avatar Circle with warm illustration */}
            <View className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border border-amber-300 items-center justify-center shadow-xs">
              <Text className="text-base font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-bold text-white tracking-tight" numberOfLines={1}>
                {user?.name || 'Local User'}
              </Text>
              <Text className="text-[11px] text-[#9E98A8]" numberOfLines={1}>
                {user?.email || 'local@screenbalance.device'}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Backdrop Tap to Close */}
        <Pressable className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
}

// Single Drawer Item matching the purple rounded pill style
function DrawerItem({
  icon,
  label,
  badgeText,
  isActive,
  onPress,
}: {
  icon: string;
  label: string;
  badgeText?: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={isActive ? styles.itemActive : styles.itemInactive}
      className="flex-row items-center justify-between px-3.5 py-2.5 rounded-2xl active:bg-[#332A45]"
    >
      <View className="flex-row items-center gap-3">
        <Text style={isActive ? styles.iconActive : styles.iconInactive}>
          {icon}
        </Text>
        <Text style={isActive ? styles.labelActive : styles.labelInactive}>
          {label}
        </Text>
      </View>

      {badgeText && (
        <View className="bg-white px-2 py-0.5 rounded-full">
          <Text className="text-[9px] font-black text-[#211C2B] uppercase">
            {badgeText}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
