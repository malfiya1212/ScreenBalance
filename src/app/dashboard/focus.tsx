import StayFreeTimePicker from '@/components/StayFreeTimePicker';
import { useApp } from '@/context/AppContext';
import { recordFocusSessionAsync } from '@/services/sqliteNotificationStorage';
import { focusStyles as styles } from '@/styles';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    Vibration,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FocusScreen() {
  const router = useRouter();
  const { focusSession, startFocusSession, cancelFocusSession } = useApp();

  // Mode: 'timer' (Countdown with Alarm) or 'watch' (Live Real Stopwatch)
  const [mode, setMode] = useState<'timer' | 'watch'>('timer');

  // --- TIME PICKER STATE (HOURS & MINUTES ROLLER WHEEL) ---
  const [pickerHours, setPickerHours] = useState(0);
  const [pickerMinutes, setPickerMinutes] = useState(25);

  // --- COUNTDOWN TIMER STATE ---
  const [countdownSeconds, setCountdownSeconds] = useState(
    () => (focusSession.isActive ? focusSession.remainingSeconds : 25 * 60)
  );
  const [, setTotalTimerDuration] = useState(
    () => (focusSession.isActive ? focusSession.totalSeconds : 25 * 60)
  );
  const [isTimerRunning, setIsTimerRunning] = useState(
    () => focusSession.isActive
  );
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);

  // --- STOPWATCH STATE ---
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isWatchRunning, setIsWatchRunning] = useState(false);

  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerAlarm = () => {
    setIsAlarmRinging(true);
    Vibration.vibrate([0, 600, 300, 600, 300, 600, 300, 1000], true);

    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    alarmIntervalRef.current = setInterval(() => {
      Vibration.vibrate([0, 600, 300, 600, 300, 600], false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      Vibration.cancel();
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerRunning && countdownSeconds > 0) {
      interval = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            cancelFocusSession();
            triggerAlarm();

            // Persist completed focus session to local SQLite
            const targetMins = pickerHours * 60 + pickerMinutes;
            recordFocusSessionAsync({
              targetMinutes: targetMins,
              actualMinutes: targetMins,
              completed: true,
              mode: 'timer',
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, countdownSeconds, cancelFocusSession, pickerHours, pickerMinutes]);

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    Vibration.cancel();
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    const totalMins = pickerHours * 60 + pickerMinutes;
    setCountdownSeconds(Math.max(60, totalMins * 60));
  };

  // Stopwatch logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isWatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatchRunning]);

  const handleTimePickerChange = (h: number, m: number) => {
    setPickerHours(h);
    setPickerMinutes(m);
    const totalSecs = (h * 60 + m) * 60;
    if (!isTimerRunning) {
      setCountdownSeconds(totalSecs);
      setTotalTimerDuration(totalSecs);
    }
  };

  const handleStartTimer = () => {
    const totalMins = pickerHours * 60 + pickerMinutes;
    if (totalMins <= 0) {
      Alert.alert('Invalid Duration', 'Please pick at least 1 minute on the roller wheel.');
      return;
    }

    const totalSecs = totalMins * 60;
    setTotalTimerDuration(totalSecs);
    setCountdownSeconds(totalSecs);
    setIsTimerRunning(true);
    startFocusSession(totalMins);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    cancelFocusSession();
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    cancelFocusSession();
    const totalMins = pickerHours * 60 + pickerMinutes;
    setCountdownSeconds(totalMins * 60);
  };

  const formatTimerDisplay = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatchDisplay = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} className="flex-1">
      <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={styles.backButton}
            className="border px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
          >
            <Text className="text-base text-white font-bold">←</Text>
            <Text className="text-xs font-semibold text-[#9E98A8]">Back</Text>
          </Pressable>

          <Text className="text-base font-extrabold text-white">Focus & Timer</Text>
          <View className="w-12" />
        </View>

        {/* Mode Selector Pill matching reference */}
        <View style={styles.modeSelector} className="border p-1 rounded-2xl flex-row mb-5">
          <Pressable
            onPress={() => {
              if (isAlarmRinging) stopAlarm();
              setMode('timer');
            }}
            style={mode === 'timer' ? styles.modeTabActive : styles.modeTab}
            className="flex-1 py-2.5 rounded-xl items-center"
          >
            <Text
              style={mode === 'timer' ? styles.modeTextActive : styles.modeText}
              className="text-xs"
            >
              ⏱️ Custom Timer & Alarm
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (isAlarmRinging) stopAlarm();
              setMode('watch');
            }}
            style={mode === 'watch' ? styles.modeTabActive : styles.modeTab}
            className="flex-1 py-2.5 rounded-xl items-center"
          >
            <Text
              style={mode === 'watch' ? styles.modeTextActive : styles.modeText}
              className="text-xs"
            >
              ⌚ Real Watch (Stopwatch)
            </Text>
          </Pressable>
        </View>

        {/* ALARM POPUP BANNER */}
        {isAlarmRinging && (
          <View style={styles.alarmBanner} className="border-2 p-5 rounded-3xl mb-5 items-center shadow-lg">
            <Text className="text-3xl mb-1">🚨</Text>
            <Text className="text-base font-black text-rose-300 mb-1">TIME IS UP!</Text>
            <Text className="text-xs text-rose-200 text-center mb-3">
              Focus session completed! Phone is vibrating.
            </Text>
            <Pressable
              onPress={stopAlarm}
              style={styles.alarmStopButton}
              className="px-6 py-2.5 rounded-xl active:opacity-90"
            >
              <Text className="text-white text-xs font-bold">Stop Alarm</Text>
            </Pressable>
          </View>
        )}

        {/* MODE 1: COUNTDOWN TIMER */}
        {mode === 'timer' && (
          <View>
            {/* Clock Card */}
            <View style={styles.displayCard} className="border p-7 rounded-3xl items-center justify-center mb-4 shadow-sm">
              <Text style={styles.displayDigits} className="text-5xl font-black tracking-tight mb-2">
                {formatTimerDisplay(countdownSeconds)}
              </Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">
                {isTimerRunning ? 'Focus Countdown Active' : 'Ready to Focus'}
              </Text>
            </View>

            {/* StayFree 2-Column Wheel Picker (Hours & Minutes) */}
            {!isTimerRunning && (
              <View style={styles.pickerCard} className="border p-4 rounded-3xl mb-5">
                <View className="flex-row justify-between items-center mb-2 px-1">
                  <Text className="text-xs font-bold text-white">
                    Set Focus Duration:
                  </Text>
                  <Text style={styles.durationValue} className="text-xs font-bold">
                    {pickerHours > 0 ? `${pickerHours}h ` : ''}
                    {pickerMinutes}m
                  </Text>
                </View>

                {/* The 2-Column Wheel Roller from User Screenshot */}
                <StayFreeTimePicker
                  hours={pickerHours}
                  minutes={pickerMinutes}
                  onChange={handleTimePickerChange}
                  maxHours={12}
                />

                <Text className="text-xs text-[#7C7389] text-center mt-2">
                  Tap or swipe up/down on hours & minutes to adjust duration
                </Text>
              </View>
            )}

            {/* Timer Action Buttons */}
            <View className="flex-row gap-3 mb-8">
              {!isTimerRunning ? (
                <Pressable
                  onPress={handleStartTimer}
                  style={styles.actionButtonPrimary}
                  className="flex-1 border py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
                >
                  <Text className="text-white text-sm font-bold tracking-wide">
                    Start Countdown ➔
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handlePauseTimer}
                  style={styles.actionButtonSecondary}
                  className="flex-1 border py-4 rounded-2xl items-center justify-center active:bg-[#2A2436]"
                >
                  <Text className="text-white text-sm font-bold tracking-wide">
                    Pause Timer
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleResetTimer}
                style={styles.resetButton}
                className="border px-5 py-4 rounded-2xl items-center justify-center active:bg-[#2A2436]"
              >
                <Text className="text-rose-400 text-xs font-bold">Reset</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* MODE 2: STOPWATCH */}
        {mode === 'watch' && (
          <View>
            <View style={styles.displayCard} className="border p-8 rounded-3xl items-center justify-center mb-5 shadow-sm">
              <Text style={styles.displayDigits} className="text-5xl font-black tracking-tight mb-2">
                {formatStopwatchDisplay(stopwatchSeconds)}
              </Text>
              <Text className="text-xs font-semibold text-[#9E98A8]">
                {isWatchRunning ? 'Live Stopwatch Running' : 'Watch Paused'}
              </Text>
            </View>

            <View className="flex-row gap-3 mb-8">
              {!isWatchRunning ? (
                <Pressable
                  onPress={() => setIsWatchRunning(true)}
                  style={styles.actionButtonPrimary}
                  className="flex-1 border py-4 rounded-2xl items-center justify-center active:opacity-90"
                >
                  <Text className="text-white text-sm font-bold tracking-wide">
                    Start Watch ➔
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setIsWatchRunning(false)}
                  style={styles.actionButtonSecondary}
                  className="flex-1 border py-4 rounded-2xl items-center justify-center active:bg-[#2A2436]"
                >
                  <Text className="text-white text-sm font-bold tracking-wide">
                    Pause Watch
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  setIsWatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                style={styles.resetButton}
                className="border px-5 py-4 rounded-2xl items-center justify-center active:bg-[#2A2436]"
              >
                <Text className="text-rose-400 text-xs font-bold">Reset</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
