import React, { useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  Vibration,
  View,
} from 'react-native';
import { timePickerStyles as styles } from '@/styles';

interface StayFreeTimePickerProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  maxHours?: number; // default 12
}

const ITEM_HEIGHT = 52;

const triggerHaptic = () => {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(25);
    } else {
      Vibration.vibrate(15);
    }
  } catch {
    // Ignore if not supported
  }
};

interface WheelColumnProps {
  value: number;
  totalCount: number; // e.g. 13 for hours (0..12), 60 for minutes (0..59)
  formatLabel: (val: number) => string;
  onValueChange: (val: number) => void;
}

function WheelColumn({
  value,
  totalCount,
  formatLabel,
  onValueChange,
}: WheelColumnProps) {
  const scrollViewRef = useRef<any>(null);
  const isUserInteracting = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // We repeat items 3 times for a seamless rolling experience
  const items = useMemo(() => {
    const base = Array.from({ length: totalCount }, (_, i) => i);
    return [
      ...base.map((val) => ({ val, set: 0 })),
      ...base.map((val) => ({ val, set: 1 })),
      ...base.map((val) => ({ val, set: 2 })),
    ];
  }, [totalCount]);

  const getScrollOffset = useMemo(
    () => (targetVal: number) => {
      return (totalCount + targetVal - 1) * ITEM_HEIGHT;
    },
    [totalCount]
  );

  // Initial position on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const initialOffset = getScrollOffset(value);
      scrollViewRef.current?.scrollTo({ y: initialOffset, animated: false });
    }, 50);

    return () => clearTimeout(timer);
  }, [getScrollOffset, value]);

  // Sync scroll when value changes from outside (e.g. preset selection)
  React.useEffect(() => {
    if (!isUserInteracting.current) {
      const targetOffset = getScrollOffset(value);
      scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
    }
  }, [getScrollOffset, value]);

  // Handle direct item click
  const handleItemPress = (itemValue: number) => {
    triggerHaptic();
    onValueChange(itemValue);
    const targetOffset = getScrollOffset(itemValue);
    scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
  };

  // Step up or down
  const handleStep = (delta: number) => {
    triggerHaptic();
    const nextVal = (value + delta + totalCount) % totalCount;
    onValueChange(nextVal);
    const targetOffset = getScrollOffset(nextVal);
    scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
  };

  // Called when scroll ends
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const centerIdx = Math.round(scrollY / ITEM_HEIGHT) + 1;
    const selectedVal = ((centerIdx % totalCount) + totalCount) % totalCount;

    if (selectedVal !== value) {
      triggerHaptic();
      onValueChange(selectedVal);
    }

    if (centerIdx < totalCount || centerIdx >= totalCount * 2) {
      const resetOffset = (totalCount + selectedVal - 1) * ITEM_HEIGHT;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: resetOffset, animated: false });
      }, 50);
    }

    isUserInteracting.current = false;
  };

  return (
    <View
      style={[styles.wheelColumn, { height: ITEM_HEIGHT * 3 }]}
      className="flex-1 max-w-[155px] border border-[#372863] overflow-hidden relative rounded-2xl bg-[#1C1530]"
    >
      {/* Background Selection Indicator (BEHIND the text at zIndex: 0) */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: 4,
          right: 4,
          height: ITEM_HEIGHT,
          backgroundColor: 'rgba(124, 58, 237, 0.22)',
          borderWidth: 1.5,
          borderColor: '#7C3AED',
          borderRadius: 12,
          zIndex: 0,
        }}
      />

      {/* Step Up Button */}
      <Pressable
        onPress={() => handleStep(-1)}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        style={{ position: 'absolute', top: 4, right: 8, zIndex: 2 }}
        className="px-1.5 py-0.5 rounded active:bg-[#3D2D68]"
        accessibilityLabel="Step up"
      >
        <Text className="text-xs text-[#C4B5FD] font-bold">▲</Text>
      </Pressable>

      {/* Vertical Scroll List (zIndex: 1, transparent background so text floats over the indicator) */}
      <ScrollView
        ref={scrollViewRef}
        style={{ zIndex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isUserInteracting.current = true;
        }}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          paddingVertical: 0,
        }}
      >
        {items.map((item, index) => {
          const isSelected = item.val === value;
          return (
            <Pressable
              key={`${item.set}-${item.val}-${index}`}
              onPress={() => handleItemPress(item.val)}
              style={{ height: ITEM_HEIGHT }}
              className="w-full items-center justify-center active:opacity-75"
              accessibilityRole="button"
              accessibilityLabel={formatLabel(item.val)}
            >
              <Text
                className={
                  isSelected
                    ? 'text-[16px] font-black tracking-tight text-white'
                    : 'text-[13px] font-medium tracking-tight text-[#8E87A3]'
                }
              >
                {formatLabel(item.val)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Step Down Button */}
      <Pressable
        onPress={() => handleStep(1)}
        hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 2 }}
        className="px-1.5 py-0.5 rounded active:bg-[#3D2D68]"
        accessibilityLabel="Step down"
      >
        <Text className="text-xs text-[#C4B5FD] font-bold">▼</Text>
      </Pressable>
    </View>
  );
}

const PRESET_ALLOWANCES = [
  { label: '15m', hours: 0, minutes: 15 },
  { label: '30m', hours: 0, minutes: 30 },
  { label: '45m', hours: 0, minutes: 45 },
  { label: '1h', hours: 1, minutes: 0 },
  { label: '1h 30m', hours: 1, minutes: 30 },
  { label: '2h', hours: 2, minutes: 0 },
  { label: '3h', hours: 3, minutes: 0 },
];

export default function StayFreeTimePicker({
  hours,
  minutes,
  onChange,
  maxHours = 12,
}: StayFreeTimePickerProps) {
  const totalHoursCount = maxHours + 1; // 0..12 -> 13
  const totalMinutesCount = 60; // 0..59

  const formatHourLabel = React.useCallback((h: number) => {
    return h === 1 ? '1 hour' : `${h} hours`;
  }, []);

  const formatMinuteLabel = React.useCallback((m: number) => {
    return m === 1 ? '1 minute' : `${m} minutes`;
  }, []);

  const handleHourChange = React.useCallback(
    (newH: number) => {
      onChange(newH, minutes);
    },
    [minutes, onChange]
  );

  const handleMinuteChange = React.useCallback(
    (newM: number) => {
      onChange(hours, newM);
    },
    [hours, onChange]
  );

  const handleSelectPreset = (presetH: number, presetM: number) => {
    triggerHaptic();
    onChange(presetH, presetM);
  };

  return (
    <View className="my-2">
      {/* Quick Preset Time Chips */}
      <View className="mb-3">
        <Text className="text-xs font-semibold text-[#8E87A3] mb-1.5 px-0.5">
          Quick Presets:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {PRESET_ALLOWANCES.map((p) => {
            const isMatch = hours === p.hours && minutes === p.minutes;
            return (
              <Pressable
                key={p.label}
                onPress={() => handleSelectPreset(p.hours, p.minutes)}
                className={`px-3.5 py-2 rounded-xl border ${
                  isMatch
                    ? 'bg-[#3D2D68] border-[#A7F3D0]'
                    : 'bg-[#1E1738] border-[#2E2554] active:bg-[#2A204C]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isMatch ? 'text-[#A7F3D0]' : 'text-[#C5BFD6]'
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Dual Wheel Rollers (Hours & Minutes) */}
      <View className="flex-row items-center justify-center gap-3.5">
        {/* COLUMN 1: HOURS WHEEL */}
        <WheelColumn
          value={hours}
          totalCount={totalHoursCount}
          formatLabel={formatHourLabel}
          onValueChange={handleHourChange}
        />

        {/* Separator Colon */}
        <Text className="text-lg font-extrabold text-[#7C3AED]">:</Text>

        {/* COLUMN 2: MINUTES WHEEL */}
        <WheelColumn
          value={minutes}
          totalCount={totalMinutesCount}
          formatLabel={formatMinuteLabel}
          onValueChange={handleMinuteChange}
        />
      </View>
    </View>
  );
}
