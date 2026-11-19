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
  maxHours?: number; // default 12 (or 23)
}

const ITEM_HEIGHT = 52;

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

  // We repeat the base items 3 times to create an infinite rolling loop
  // Set 0: 0..totalCount-1
  // Set 1: 0..totalCount-1 (center set)
  // Set 2: 0..totalCount-1
  const items = useMemo(() => {
    const base = Array.from({ length: totalCount }, (_, i) => i);
    return [
      ...base.map((val) => ({ val, set: 0 })),
      ...base.map((val) => ({ val, set: 1 })),
      ...base.map((val) => ({ val, set: 2 })),
    ];
  }, [totalCount]);

  // Helper to calculate target scroll offset for a specific value in Set 1
  const getScrollOffset = useMemo(
    () =>
      (targetVal: number) => {
        // In Set 1, targetVal is at index (totalCount + targetVal)
        // Since middle row is visible at y=52..104, scrollOffset is (index - 1) * ITEM_HEIGHT
        return (totalCount + targetVal - 1) * ITEM_HEIGHT;
      },
    [totalCount]
  );

  // Initial positioning on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const initialOffset = getScrollOffset(value);
      scrollViewRef.current?.scrollTo({ y: initialOffset, animated: false });
    }, 60);

    return () => clearTimeout(timer);
  }, [getScrollOffset, value]);

  // When value prop updates externally, animate scroll if user is not actively dragging
  React.useEffect(() => {
    if (!isUserInteracting.current) {
      const targetOffset = getScrollOffset(value);
      scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
    }
  }, [getScrollOffset, value]);

  // Handle direct item selection on tap
  const handleItemPress = (itemValue: number) => {
    try {
      Vibration.vibrate(15);
    } catch {}
    onValueChange(itemValue);
    const targetOffset = getScrollOffset(itemValue);
    scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
  };

  // Step up or down by delta
  const handleStep = (delta: number) => {
    try {
      Vibration.vibrate(15);
    } catch {}
    const nextVal = (value + delta + totalCount) % totalCount;
    onValueChange(nextVal);
    const targetOffset = getScrollOffset(nextVal);
    scrollViewRef.current?.scrollTo({ y: targetOffset, animated: true });
  };

  // Called when scroll ends
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    // The middle item index is scrollY / ITEM_HEIGHT + 1
    const centerIdx = Math.round(scrollY / ITEM_HEIGHT) + 1;
    const selectedVal = ((centerIdx % totalCount) + totalCount) % totalCount;

    if (selectedVal !== value) {
      try {
        Vibration.vibrate(15);
      } catch {}
      onValueChange(selectedVal);
    }

    // Keep scroll position within Set 1 boundaries
    if (centerIdx < totalCount || centerIdx >= totalCount * 2) {
      const resetOffset = (totalCount + selectedVal - 1) * ITEM_HEIGHT;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: resetOffset, animated: false });
      }, 50);
    }

    isUserInteracting.current = false;
  };

  // Desktop Web mouse wheel handler
  const handleWheel = (e: any) => {
    if (Platform.OS === 'web' && e && typeof e.deltaY === 'number') {
      if (Math.abs(e.deltaY) > 2) {
        const delta = e.deltaY > 0 ? 1 : -1;
        handleStep(delta);
      }
    }
  };

  return (
    <View
      style={[styles.wheelColumn, { height: ITEM_HEIGHT * 3 }]}
      className="flex-1 max-w-[150px] border overflow-hidden relative"
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } : {})}
    >
      {/* Background Selection Indicator (Center Row: y=52 to y=104) */}
      <View
        pointerEvents="none"
        style={[
          styles.selectedRow,
          {
            position: 'absolute',
            top: ITEM_HEIGHT,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderTopColor: '#3D3354',
            borderBottomColor: '#3D3354',
            zIndex: 1,
          },
        ]}
      />

      {/* Vertical Scroll List */}
      <ScrollView
        ref={scrollViewRef}
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
              className="w-full items-center justify-center active:bg-[#322C3E]"
              accessibilityRole="button"
              accessibilityLabel={formatLabel(item.val)}
            >
              <Text
                style={isSelected ? styles.selectedLabel : styles.unselectedLabel}
                className={
                  isSelected
                    ? 'text-[16px] font-black tracking-tight text-white'
                    : 'text-[14px] font-medium tracking-tight text-[#9E9AA7]'
                }
              >
                {formatLabel(item.val)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Subtle Step Up Button overlay on top edge for quick single steps */}
      <Pressable
        onPress={() => handleStep(-1)}
        hitSlop={{ top: 4, bottom: 4, left: 10, right: 10 }}
        style={{ position: 'absolute', top: 4, right: 8, zIndex: 2 }}
        className="opacity-40 active:opacity-100"
        accessibilityLabel="Step up"
      >
        <Text className="text-[10px] text-[#A69FC0]">▲</Text>
      </Pressable>

      {/* Subtle Step Down Button overlay on bottom edge for quick single steps */}
      <Pressable
        onPress={() => handleStep(1)}
        hitSlop={{ top: 4, bottom: 4, left: 10, right: 10 }}
        style={{ position: 'absolute', bottom: 4, right: 8, zIndex: 2 }}
        className="opacity-40 active:opacity-100"
        accessibilityLabel="Step down"
      >
        <Text className="text-[10px] text-[#A69FC0]">▼</Text>
      </Pressable>
    </View>
  );
}

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

  return (
    <View className="flex-row items-center justify-center gap-3.5 my-2">
      {/* COLUMN 1: HOURS WHEEL */}
      <WheelColumn
        value={hours}
        totalCount={totalHoursCount}
        formatLabel={formatHourLabel}
        onValueChange={handleHourChange}
      />

      {/* COLUMN 2: MINUTES WHEEL */}
      <WheelColumn
        value={minutes}
        totalCount={totalMinutesCount}
        formatLabel={formatMinuteLabel}
        onValueChange={handleMinuteChange}
      />
    </View>
  );
}
