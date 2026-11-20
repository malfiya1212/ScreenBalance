import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, AppState, StyleSheet } from 'react-native';
import { calculateTodayFocusPoints, FocusChallengeResult } from '@/services/localFocusEngine';
import { startNativeTrackingService } from '@/services/usageSyncService';
import { getTodayDateKey } from '@/services/sqliteNotificationStorage';

export interface AppRuleItem {
  id: string;
  name: string;
  limit: number;
  used?: number;
  category?: string;
}

interface FocusChallengeCardProps {
  appLimits: AppRuleItem[];
  dateKey?: string;
  onPointsCalculated?: (points: number) => void;
}

export function FocusChallengeCard({
  appLimits,
  dateKey = getTodayDateKey(),
  onPointsCalculated,
}: FocusChallengeCardProps) {
  const [result, setResult] = useState<FocusChallengeResult>({
    dateKey,
    points: 0,
    totalRules: 0,
    completedRules: 0,
    details: [],
  });
  const [autoTrackingActive, setAutoTrackingActive] = useState<boolean>(true);

  const evaluateChallenge = useCallback(async () => {
    // 1. Ensure Android tracking service is continuously running
    try {
      startNativeTrackingService();
      setAutoTrackingActive(true);
    } catch {
      setAutoTrackingActive(false);
    }

    // 2. Compute local focus challenge points
    const res = await calculateTodayFocusPoints(appLimits, dateKey);
    setResult(res);
    if (onPointsCalculated) {
      onPointsCalculated(res.points);
    }
  }, [appLimits, dateKey, onPointsCalculated]);

  useEffect(() => {
    let isMounted = true;

    // Run automatically asynchronously on mount
    (async () => {
      try {
        startNativeTrackingService();
        setAutoTrackingActive(true);
      } catch {
        setAutoTrackingActive(false);
      }
      const res = await calculateTodayFocusPoints(appLimits, dateKey);
      if (isMounted) {
        setResult(res);
        if (onPointsCalculated) {
          onPointsCalculated(res.points);
        }
      }
    })();

    // Re-evaluate on AppState 'active' (user opens or returns to app)
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isMounted) {
        evaluateChallenge();
      }
    });

    // Short local interval while on screen (every 15s)
    const timer = setInterval(() => {
      if (isMounted) {
        evaluateChallenge();
      }
    }, 15000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(timer);
    };
  }, [appLimits, dateKey, evaluateChallenge, onPointsCalculated]);

  const hasRules = appLimits.length > 0;
  const targetApp = hasRules ? appLimits[0] : null;
  const targetDetail = result.details.find((d) => d.ruleName === targetApp?.name);

  const usedMinutes = targetDetail ? targetDetail.usedMinutes : (targetApp?.used || 0);
  const limitMinutes = targetApp ? targetApp.limit : 0;
  const isOver = limitMinutes > 0 && usedMinutes > limitMinutes;
  const progressPct =
    limitMinutes > 0 ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)) : 0;
  const barColor = isOver ? '#EF4444' : '#84CC16';

  const formatMins = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  return (
    <View style={styles.cardContainer} className="border p-4 rounded-3xl mb-4 shadow-sm">
      {/* Auto-Tracking Live Indicator (No manual start button needed) */}
      <View className="flex-row items-center justify-between mb-3 pb-2.5 border-b border-[#2D273A]">
        <View className="flex-row items-center gap-2">
          <View
            className={`w-2 h-2 rounded-full ${
              autoTrackingActive ? 'bg-emerald-400' : 'bg-gray-400'
            }`}
          />
          <Text className="text-xs font-bold text-[#E5E0EE]">
            {autoTrackingActive ? 'Live Real-Time Tracking Active' : 'Offline Tracking'}
          </Text>
        </View>
        <Text className="text-xs text-[#A7F3D0] font-semibold">100% On-Device</Text>
      </View>

      {/* Challenge Header & Calculated Points */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          <Text className="text-lg">🎯</Text>
          <View className="flex-1">
            <Text className="text-sm font-bold text-white">
              {hasRules && targetApp
                ? `Stay within ${formatMins(limitMinutes)} on ${targetApp.name}`
                : "Today's Focus Challenge"}
            </Text>
            <Text className="text-xs text-[#9E98A8]">
              {hasRules && targetApp
                ? `Usage: ${formatMins(usedMinutes)} used of ${formatMins(limitMinutes)} allowance`
                : 'Set an app limit below to activate daily challenges'}
            </Text>
          </View>
        </View>

        {/* Dynamic Points: +1 per completed rule */}
        <View style={styles.badge} className="border px-3 py-1 rounded-full items-center">
          <Text className="text-xs font-extrabold text-[#84CC16]">
            {result.points > 0 ? `+${result.points} pts` : `${result.points} pts`}
          </Text>
        </View>
      </View>

      {/* Progress Bar & Status */}
      <View>
        <View className="w-full h-2.5 bg-[#16131D] rounded-full overflow-hidden mb-1.5">
          <View
            style={{
              width: `${hasRules ? progressPct : 0}%`,
              backgroundColor: barColor,
            }}
            className="h-full rounded-full"
          />
        </View>

        <View className="flex-row justify-between items-center">
          <Text style={{ color: barColor }} className="text-xs font-bold">
            {hasRules && targetApp
              ? isOver
                ? `⚠️ Over limit by ${formatMins(usedMinutes - limitMinutes)}`
                : `${progressPct}% Used (${formatMins(Math.max(0, limitMinutes - usedMinutes))} remaining)`
              : '0% • Inactive (Set app limit below)'}
          </Text>
          <Text className="text-xs text-[#7C7389] font-semibold">
            {hasRules && targetApp
              ? `${formatMins(usedMinutes)} / ${formatMins(limitMinutes)}`
              : 'Daily Goal'}
          </Text>
        </View>
      </View>

      {/* Summary of all active rules if multiple exist */}
      {result.totalRules > 1 && (
        <View className="mt-2.5 pt-2 border-t border-[#231E30] flex-row items-center justify-between">
          <Text className="text-xs text-[#9E98A8]">
            {result.completedRules} of {result.totalRules} limits currently on track
          </Text>
          <Text className="text-xs text-[#84CC16] font-bold">
            +{result.completedRules} pts earned today
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#1E1929',
    borderColor: '#342D45',
  },
  badge: {
    backgroundColor: '#192C1D',
    borderColor: '#22542B',
  },
});
