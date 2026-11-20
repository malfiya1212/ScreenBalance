import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { syncAndGetDailyUsage, startNativeTrackingService, TodayUsageStats } from '@/services/usageSyncService';
import { getTodayDateKey } from '@/services/sqliteNotificationStorage';

export function useAutoDailyStats(dateKey: string = getTodayDateKey()) {
  const [stats, setStats] = useState<TodayUsageStats>({
    totalScreenMinutes: 0,
    unlocks: 0,
    pickups: 0,
    notifications: 0,
    appUsage: {},
  });
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      const data = await syncAndGetDailyUsage(dateKey);
      setStats(data);
    } catch {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    let isMounted = true;

    // Start native broadcast receiver tracking service
    startNativeTrackingService();

    // Initial load
    syncAndGetDailyUsage(dateKey)
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    // Refresh every time user unlocks or brings app to foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isMounted) {
        refreshStats();
      }
    });

    // Background interval poll (every 10s while active)
    const interval = setInterval(() => {
      if (isMounted) {
        refreshStats();
      }
    }, 10000);

    return () => {
      isMounted = false;
      sub.remove();
      clearInterval(interval);
    };
  }, [dateKey, refreshStats]);

  return { stats, loading, refreshStats };
}
