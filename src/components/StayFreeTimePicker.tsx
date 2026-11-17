import React, { useRef } from 'react';
import {
  PanResponder,
  Pressable,
  Text,
  Vibration,
  View,
} from 'react-native';

interface StayFreeTimePickerProps {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  maxHours?: number; // default 12 (or 23)
}

export default function StayFreeTimePicker({
  hours,
  minutes,
  onChange,
  maxHours = 12,
}: StayFreeTimePickerProps) {
  const totalHoursCount = maxHours + 1; // e.g. 0..12 -> 13
  const totalMinutesCount = 60; // 0..59

  // Helper formatting to match StayFree screenshot exactly:
  // "12 hours", "0 hours", "1 hour"
  // "3 minutes", "4 minutes", "5 minutes"
  const formatHourLabel = (h: number) => {
    return h === 1 ? '1 hour' : `${h} hours`;
  };

  const formatMinuteLabel = (m: number) => {
    return m === 1 ? '1 minute' : `${m} minutes`;
  };

  const prevHour = (hours - 1 + totalHoursCount) % totalHoursCount;
  const nextHour = (hours + 1) % totalHoursCount;

  const prevMinute = (minutes - 1 + totalMinutesCount) % totalMinutesCount;
  const nextMinute = (minutes + 1) % totalMinutesCount;

  const handleHourStep = (delta: number) => {
    try {
      Vibration.vibrate(15);
    } catch {}
    const newH = (hours + delta + totalHoursCount) % totalHoursCount;
    onChange(newH, minutes);
  };

  const handleMinuteStep = (delta: number) => {
    try {
      Vibration.vibrate(15);
    } catch {}
    const newM = (minutes + delta + totalMinutesCount) % totalMinutesCount;
    onChange(hours, newM);
  };

  // Drag Gesture Handlers for Hours Wheel
  const lastHourY = useRef(0);
  const hourPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastHourY.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = gestureState.dy - lastHourY.current;
        const THRESHOLD = 35;
        if (delta > THRESHOLD) {
          handleHourStep(-1); // dragged down -> prev
          lastHourY.current = gestureState.dy;
        } else if (delta < -THRESHOLD) {
          handleHourStep(1); // dragged up -> next
          lastHourY.current = gestureState.dy;
        }
      },
    })
  ).current;

  // Drag Gesture Handlers for Minutes Wheel
  const lastMinuteY = useRef(0);
  const minutePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastMinuteY.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const delta = gestureState.dy - lastMinuteY.current;
        const THRESHOLD = 30;
        if (delta > THRESHOLD) {
          handleMinuteStep(-1);
          lastMinuteY.current = gestureState.dy;
        } else if (delta < -THRESHOLD) {
          handleMinuteStep(1);
          lastMinuteY.current = gestureState.dy;
        }
      },
    })
  ).current;

  return (
    <View className="flex-row items-center justify-center gap-3.5 my-2">
      {/* ============================================================== */}
      {/* COLUMN 1: HOURS WHEEL                                          */}
      {/* ============================================================== */}
      <View
        style={{
          backgroundColor: '#282432',
          borderColor: '#352F42',
          borderRadius: 20,
        }}
        className="flex-1 max-w-[150px] border overflow-hidden shadow-sm"
        {...hourPanResponder.panHandlers}
      >
        {/* Row 1: Previous Hour */}
        <Pressable
          onPress={() => handleHourStep(-1)}
          hitSlop={8}
          className="h-[52px] items-center justify-center active:bg-[#322C3E]"
        >
          <Text
            style={{ color: '#7C7389' }}
            className="text-[14px] font-medium tracking-tight"
          >
            {formatHourLabel(prevHour)}
          </Text>
        </Pressable>

        {/* Divider 1 */}
        <View style={{ backgroundColor: '#383245' }} className="h-[1px] w-full" />

        {/* Row 2: Selected Hour (Bright White Bold Center) */}
        <View
          style={{ backgroundColor: '#2E283A' }}
          className="h-[56px] items-center justify-center"
        >
          <Text
            style={{ color: '#FFFFFF' }}
            className="text-[16px] font-black tracking-tight"
          >
            {formatHourLabel(hours)}
          </Text>
        </View>

        {/* Divider 2 */}
        <View style={{ backgroundColor: '#383245' }} className="h-[1px] w-full" />

        {/* Row 3: Next Hour */}
        <Pressable
          onPress={() => handleHourStep(1)}
          hitSlop={8}
          className="h-[52px] items-center justify-center active:bg-[#322C3E]"
        >
          <Text
            style={{ color: '#7C7389' }}
            className="text-[14px] font-medium tracking-tight"
          >
            {formatHourLabel(nextHour)}
          </Text>
        </Pressable>
      </View>

      {/* ============================================================== */}
      {/* COLUMN 2: MINUTES WHEEL                                        */}
      {/* ============================================================== */}
      <View
        style={{
          backgroundColor: '#282432',
          borderColor: '#352F42',
          borderRadius: 20,
        }}
        className="flex-1 max-w-[150px] border overflow-hidden shadow-sm"
        {...minutePanResponder.panHandlers}
      >
        {/* Row 1: Previous Minute */}
        <Pressable
          onPress={() => handleMinuteStep(-1)}
          hitSlop={8}
          className="h-[52px] items-center justify-center active:bg-[#322C3E]"
        >
          <Text
            style={{ color: '#7C7389' }}
            className="text-[14px] font-medium tracking-tight"
          >
            {formatMinuteLabel(prevMinute)}
          </Text>
        </Pressable>

        {/* Divider 1 */}
        <View style={{ backgroundColor: '#383245' }} className="h-[1px] w-full" />

        {/* Row 2: Selected Minute (Bright White Bold Center) */}
        <View
          style={{ backgroundColor: '#2E283A' }}
          className="h-[56px] items-center justify-center"
        >
          <Text
            style={{ color: '#FFFFFF' }}
            className="text-[16px] font-black tracking-tight"
          >
            {formatMinuteLabel(minutes)}
          </Text>
        </View>

        {/* Divider 2 */}
        <View style={{ backgroundColor: '#383245' }} className="h-[1px] w-full" />

        {/* Row 3: Next Minute */}
        <Pressable
          onPress={() => handleMinuteStep(1)}
          hitSlop={8}
          className="h-[52px] items-center justify-center active:bg-[#322C3E]"
        >
          <Text
            style={{ color: '#7C7389' }}
            className="text-[14px] font-medium tracking-tight"
          >
            {formatMinuteLabel(nextMinute)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
