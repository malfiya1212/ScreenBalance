export interface SentNotificationRecord {
  id: string;
  app_id: string;
  app_name: string;
  threshold: number;
  date_key: string; // e.g. "2026-11-20"
  remaining_minutes: number;
  limit_minutes: number;
  title: string;
  message: string;
  severity: string;
  sent_at: number;
}

export interface DailyUsageRecord {
  id: string;
  date_key: string;
  app_id: string;
  app_name: string;
  category: string;
  minutes_used: number;
  pickups: number;
  unlocks: number;
  last_updated: number;
}

export interface FocusSessionRecord {
  id: string;
  date_key: string;
  start_time: number;
  target_minutes: number;
  actual_minutes: number;
  completed: boolean;
  mode: 'timer' | 'watch';
}

export interface InAppShieldRecord {
  id: string;
  package_name: string;
  app_name: string;
  feature_name: string;
  blocked_keywords: string;
  is_enabled: boolean;
  blocks_prevented: number;
  created_at: number;
}

export interface PersistedAppLimitRecord {
  id: string;
  name: string;
  category: string;
  limit_minutes: number;
  created_at: number;
}

export interface ScheduleRecord {
  id: string;
  name: string; // e.g., "Deep Study", "Sleep & Night"
  type: 'study' | 'sleep' | 'focus';
  start_time: string; // "22:00"
  end_time: string; // "07:00"
  days_active: string; // JSON array string e.g. "[\"Mon\",\"Tue\",\"Wed\"]"
  is_enabled: boolean;
  blocked_apps: string; // JSON array string
}

export interface UserAccountRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: number;
}

export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fallback in-memory/localStorage keys for Web/Simulator environments
const STORAGE_KEYS = {
  notifications: 'sb_sqlite_sent_notifications',
  usage: 'sb_sqlite_daily_usage',
  focus: 'sb_sqlite_focus_sessions',
  shields: 'sb_sqlite_in_app_shields',
  limits: 'sb_sqlite_app_limits',
  schedules: 'sb_sqlite_schedules',
  users: 'sb_sqlite_users',
};

const loadFallback = <T>(key: string): T[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
};

const saveFallback = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
};

let fallbackNotifications: SentNotificationRecord[] = loadFallback(STORAGE_KEYS.notifications);
let fallbackUsage: DailyUsageRecord[] = loadFallback(STORAGE_KEYS.usage);
let fallbackFocus: FocusSessionRecord[] = loadFallback(STORAGE_KEYS.focus);
let fallbackShields: InAppShieldRecord[] = loadFallback(STORAGE_KEYS.shields);
let fallbackLimits: PersistedAppLimitRecord[] = loadFallback(STORAGE_KEYS.limits);
let fallbackSchedules: ScheduleRecord[] = loadFallback(STORAGE_KEYS.schedules);
let fallbackUsers: UserAccountRecord[] = loadFallback(STORAGE_KEYS.users);

let nativeDb: any = null;
let isNativeDbReady = false;
let dbInitializationPromise: Promise<boolean> | null = null;

/**
 * Initializes the On-Device SQLite Database and creates all relational tables:
 * - sent_notifications (with UNIQUE milestone constraint)
 * - app_daily_usage (with UNIQUE date_key + app_id constraint)
 * - focus_sessions
 * - in_app_shields
 * - app_limits_store
 */
export async function initSqliteAsync(): Promise<boolean> {
  if (isNativeDbReady) return true;
  if (dbInitializationPromise) return dbInitializationPromise;

  dbInitializationPromise = (async () => {
    try {
      const SQLite = await import('expo-sqlite');
      nativeDb = await SQLite.openDatabaseAsync('screenbalance_notifications.db');

      await nativeDb.execAsync(`
        -- 1. Sent Notifications with Duplicate Prevention
        CREATE TABLE IF NOT EXISTS sent_notifications (
          id TEXT PRIMARY KEY NOT NULL,
          app_id TEXT NOT NULL,
          app_name TEXT NOT NULL,
          threshold INTEGER NOT NULL,
          date_key TEXT NOT NULL,
          remaining_minutes INTEGER NOT NULL,
          limit_minutes INTEGER NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT NOT NULL,
          sent_at INTEGER NOT NULL,
          UNIQUE(app_id, threshold, date_key)
        );
        CREATE INDEX IF NOT EXISTS idx_sent_notif_lookup 
        ON sent_notifications(app_id, threshold, date_key);

        -- 2. Daily Screen Time & Engagement Usage Logs
        CREATE TABLE IF NOT EXISTS app_daily_usage (
          id TEXT PRIMARY KEY NOT NULL,
          date_key TEXT NOT NULL,
          app_id TEXT NOT NULL,
          app_name TEXT NOT NULL,
          category TEXT NOT NULL,
          minutes_used INTEGER NOT NULL DEFAULT 0,
          pickups INTEGER NOT NULL DEFAULT 0,
          unlocks INTEGER NOT NULL DEFAULT 0,
          last_updated INTEGER NOT NULL,
          UNIQUE(date_key, app_id)
        );
        CREATE INDEX IF NOT EXISTS idx_daily_usage_date 
        ON app_daily_usage(date_key);

        -- 3. Focus Sessions History
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          date_key TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          target_minutes INTEGER NOT NULL,
          actual_minutes INTEGER NOT NULL,
          completed INTEGER NOT NULL DEFAULT 1,
          mode TEXT NOT NULL DEFAULT 'timer'
        );
        CREATE INDEX IF NOT EXISTS idx_focus_date 
        ON focus_sessions(date_key);

        -- 4. In-App Granular Blocking Rules
        CREATE TABLE IF NOT EXISTS in_app_shields (
          id TEXT PRIMARY KEY NOT NULL,
          package_name TEXT NOT NULL,
          app_name TEXT NOT NULL,
          feature_name TEXT NOT NULL,
          blocked_keywords TEXT NOT NULL,
          is_enabled INTEGER NOT NULL DEFAULT 1,
          blocks_prevented INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );

        -- 5. Persistent App Limits Store
        CREATE TABLE IF NOT EXISTS app_limits_store (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          limit_minutes INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );

        -- 6. Study and Sleep Schedules Store
        CREATE TABLE IF NOT EXISTS app_schedules (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          days_active TEXT NOT NULL,
          is_enabled INTEGER NOT NULL DEFAULT 1,
          blocked_apps TEXT NOT NULL
        );

        -- 7. Persistent User Accounts Store (Local SQLite Auth)
        CREATE TABLE IF NOT EXISTS user_accounts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);

      isNativeDbReady = true;
      return true;
    } catch {
      isNativeDbReady = false;
      fallbackNotifications = loadFallback(STORAGE_KEYS.notifications);
      fallbackUsage = loadFallback(STORAGE_KEYS.usage);
      fallbackFocus = loadFallback(STORAGE_KEYS.focus);
      fallbackShields = loadFallback(STORAGE_KEYS.shields);
      fallbackLimits = loadFallback(STORAGE_KEYS.limits);
      fallbackSchedules = loadFallback(STORAGE_KEYS.schedules);
      return true;
    }
  })();

  return dbInitializationPromise;
}

/* ========================================================================== */
/* SECTION 1: SENT NOTIFICATIONS (DE-DUPLICATION ENGINE)                      */
/* ========================================================================== */

export async function hasNotificationBeenSentAsync(
  appId: string,
  threshold: number,
  dateKey: string = getTodayDateKey()
): Promise<boolean> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const row = await nativeDb.getFirstAsync(
        'SELECT id FROM sent_notifications WHERE app_id = ? AND threshold = ? AND date_key = ? LIMIT 1;',
        [appId, threshold, dateKey]
      );
      return !!row;
    } catch {}
  }

  return fallbackNotifications.some(
    (item) =>
      item.app_id === appId &&
      item.threshold === threshold &&
      item.date_key === dateKey
  );
}

export async function recordSentNotificationAsync(
  record: SentNotificationRecord
): Promise<boolean> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO sent_notifications (
          id, app_id, app_name, threshold, date_key, remaining_minutes, limit_minutes, title, message, severity, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.app_id,
          record.app_name,
          record.threshold,
          record.date_key,
          record.remaining_minutes,
          record.limit_minutes,
          record.title,
          record.message,
          record.severity,
          record.sent_at,
        ]
      );
      return true;
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE') || e?.message?.includes('constraint')) {
        return false;
      }
    }
  }

  const alreadyExists = fallbackNotifications.some(
    (item) =>
      item.app_id === record.app_id &&
      item.threshold === record.threshold &&
      item.date_key === record.date_key
  );

  if (alreadyExists) return false;

  fallbackNotifications.unshift(record);
  saveFallback(STORAGE_KEYS.notifications, fallbackNotifications);
  return true;
}

export async function getSentNotificationsAsync(
  dateKey?: string
): Promise<SentNotificationRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      if (dateKey) {
        const rows = await nativeDb.getAllAsync(
          'SELECT * FROM sent_notifications WHERE date_key = ? ORDER BY sent_at DESC;',
          [dateKey]
        );
        return rows as SentNotificationRecord[];
      } else {
        const rows = await nativeDb.getAllAsync(
          'SELECT * FROM sent_notifications ORDER BY sent_at DESC LIMIT 100;'
        );
        return rows as SentNotificationRecord[];
      }
    } catch {}
  }

  if (dateKey) {
    return fallbackNotifications.filter((r) => r.date_key === dateKey);
  }
  return fallbackNotifications;
}

export async function deleteSentNotificationByIdAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM sent_notifications WHERE id = ?;', [id]);
      return;
    } catch {}
  }

  fallbackNotifications = fallbackNotifications.filter((r) => r.id !== id);
  saveFallback(STORAGE_KEYS.notifications, fallbackNotifications);
}

export async function clearSentNotificationsAsync(dateKey?: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      if (dateKey) {
        await nativeDb.runAsync('DELETE FROM sent_notifications WHERE date_key = ?;', [dateKey]);
      } else {
        await nativeDb.runAsync('DELETE FROM sent_notifications;');
      }
      return;
    } catch {}
  }

  if (dateKey) {
    fallbackNotifications = fallbackNotifications.filter((r) => r.date_key !== dateKey);
  } else {
    fallbackNotifications = [];
  }
  saveFallback(STORAGE_KEYS.notifications, fallbackNotifications);
}

/* ========================================================================== */
/* SECTION 2: DAILY APP USAGE & ENGAGEMENT LOGS                               */
/* ========================================================================== */

export async function recordDailyAppUsageAsync(params: {
  appId: string;
  appName: string;
  category?: string;
  minutesDelta: number;
  pickupsDelta?: number;
  unlocksDelta?: number;
  dateKey?: string;
}): Promise<void> {
  await initSqliteAsync();
  const dateKey = params.dateKey || getTodayDateKey();
  const category = params.category || 'Productivity';
  const pickupsDelta = params.pickupsDelta || 0;
  const unlocksDelta = params.unlocksDelta || 0;
  const now = Date.now();
  const rowId = `${dateKey}_${params.appId}`;

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO app_daily_usage (
          id, date_key, app_id, app_name, category, minutes_used, pickups, unlocks, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date_key, app_id) DO UPDATE SET
          minutes_used = MAX(0, app_daily_usage.minutes_used + excluded.minutes_used),
          pickups = MAX(0, app_daily_usage.pickups + excluded.pickups),
          unlocks = MAX(0, app_daily_usage.unlocks + excluded.unlocks),
          last_updated = excluded.last_updated;`,
        [
          rowId,
          dateKey,
          params.appId,
          params.appName,
          category,
          params.minutesDelta,
          pickupsDelta,
          unlocksDelta,
          now,
        ]
      );
      return;
    } catch {}
  }

  // Fallback
  const existingIndex = fallbackUsage.findIndex(
    (u) => u.date_key === dateKey && u.app_id === params.appId
  );
  if (existingIndex >= 0) {
    const existing = fallbackUsage[existingIndex];
    fallbackUsage[existingIndex] = {
      ...existing,
      minutes_used: Math.max(0, existing.minutes_used + params.minutesDelta),
      pickups: Math.max(0, existing.pickups + pickupsDelta),
      unlocks: Math.max(0, existing.unlocks + unlocksDelta),
      last_updated: now,
    };
  } else {
    fallbackUsage.unshift({
      id: rowId,
      date_key: dateKey,
      app_id: params.appId,
      app_name: params.appName,
      category,
      minutes_used: Math.max(0, params.minutesDelta),
      pickups: Math.max(0, pickupsDelta),
      unlocks: Math.max(0, unlocksDelta),
      last_updated: now,
    });
  }
  saveFallback(STORAGE_KEYS.usage, fallbackUsage);
}

export async function getDailyUsageForDateAsync(
  dateKey: string = getTodayDateKey()
): Promise<DailyUsageRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM app_daily_usage WHERE date_key = ? ORDER BY minutes_used DESC;',
        [dateKey]
      );
      return rows as DailyUsageRecord[];
    } catch {}
  }

  return fallbackUsage.filter((u) => u.date_key === dateKey);
}

export async function getDailyUsageSummaryAsync(
  dateKey: string = getTodayDateKey()
): Promise<{
  totalMinutes: number;
  totalPickups: number;
  totalUnlocks: number;
  records: DailyUsageRecord[];
}> {
  const records = await getDailyUsageForDateAsync(dateKey);
  const totalMinutes = records.reduce((sum, r) => sum + r.minutes_used, 0);
  const totalPickups = records.reduce((sum, r) => sum + r.pickups, 0);
  const totalUnlocks = records.reduce((sum, r) => sum + r.unlocks, 0);

  return { totalMinutes, totalPickups, totalUnlocks, records };
}

export async function resetDailyUsageForDateAsync(dateKey: string = getTodayDateKey()): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM app_daily_usage WHERE date_key = ?;', [dateKey]);
      return;
    } catch {}
  }

  fallbackUsage = fallbackUsage.filter((u) => u.date_key !== dateKey);
  saveFallback(STORAGE_KEYS.usage, fallbackUsage);
}

/* ========================================================================== */
/* SECTION 3: FOCUS SESSIONS LOGGING                                          */
/* ========================================================================== */

export async function recordFocusSessionAsync(params: {
  targetMinutes: number;
  actualMinutes: number;
  completed: boolean;
  mode?: 'timer' | 'watch';
}): Promise<FocusSessionRecord> {
  await initSqliteAsync();
  const dateKey = getTodayDateKey();
  const id = `focus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: FocusSessionRecord = {
    id,
    date_key: dateKey,
    start_time: Date.now(),
    target_minutes: params.targetMinutes,
    actual_minutes: params.actualMinutes,
    completed: params.completed,
    mode: params.mode || 'timer',
  };

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO focus_sessions (
          id, date_key, start_time, target_minutes, actual_minutes, completed, mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          record.id,
          record.date_key,
          record.start_time,
          record.target_minutes,
          record.actual_minutes,
          record.completed ? 1 : 0,
          record.mode,
        ]
      );
      return record;
    } catch {}
  }

  fallbackFocus.unshift(record);
  saveFallback(STORAGE_KEYS.focus, fallbackFocus);
  return record;
}

export async function getFocusSessionsHistoryAsync(limit = 50): Promise<FocusSessionRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM focus_sessions ORDER BY start_time DESC LIMIT ?;',
        [limit]
      );
      return (rows as any[]).map((r) => ({
        ...r,
        completed: Boolean(r.completed),
      })) as FocusSessionRecord[];
    } catch {}
  }

  return fallbackFocus.slice(0, limit);
}

/* ========================================================================== */
/* SECTION 4: IN-APP SHIELDS PERSISTENCE                                      */
/* ========================================================================== */

export async function getPersistedInAppShieldsAsync(): Promise<InAppShieldRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM in_app_shields ORDER BY created_at ASC;'
      );
      return (rows as any[]).map((r) => ({
        ...r,
        is_enabled: Boolean(r.is_enabled),
      })) as InAppShieldRecord[];
    } catch {}
  }

  return fallbackShields;
}

export async function savePersistedInAppShieldAsync(
  shield: InAppShieldRecord
): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT OR REPLACE INTO in_app_shields (
          id, package_name, app_name, feature_name, blocked_keywords, is_enabled, blocks_prevented, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          shield.id,
          shield.package_name,
          shield.app_name,
          shield.feature_name,
          shield.blocked_keywords,
          shield.is_enabled ? 1 : 0,
          shield.blocks_prevented || 0,
          shield.created_at || Date.now(),
        ]
      );
      return;
    } catch {}
  }

  const index = fallbackShields.findIndex((s) => s.id === shield.id);
  if (index >= 0) {
    fallbackShields[index] = shield;
  } else {
    fallbackShields.push(shield);
  }
  saveFallback(STORAGE_KEYS.shields, fallbackShields);
}

export async function togglePersistedInAppShieldAsync(
  id: string,
  isEnabled: boolean
): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        'UPDATE in_app_shields SET is_enabled = ? WHERE id = ?;',
        [isEnabled ? 1 : 0, id]
      );
      return;
    } catch {}
  }

  fallbackShields = fallbackShields.map((s) =>
    s.id === id ? { ...s, is_enabled: isEnabled } : s
  );
  saveFallback(STORAGE_KEYS.shields, fallbackShields);
}

export async function incrementShieldBlockPreventedAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        'UPDATE in_app_shields SET blocks_prevented = blocks_prevented + 1 WHERE id = ?;',
        [id]
      );
      return;
    } catch {}
  }

  fallbackShields = fallbackShields.map((s) =>
    s.id === id ? { ...s, blocks_prevented: (s.blocks_prevented || 0) + 1 } : s
  );
  saveFallback(STORAGE_KEYS.shields, fallbackShields);
}

export async function deletePersistedInAppShieldAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM in_app_shields WHERE id = ?;', [id]);
      return;
    } catch {}
  }

  fallbackShields = fallbackShields.filter((s) => s.id !== id);
  saveFallback(STORAGE_KEYS.shields, fallbackShields);
}

/* ========================================================================== */
/* SECTION 5: APP LIMITS PERSISTENCE                                          */
/* ========================================================================== */

export async function getPersistedAppLimitsAsync(): Promise<PersistedAppLimitRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM app_limits_store ORDER BY created_at ASC;'
      );
      return rows as PersistedAppLimitRecord[];
    } catch {}
  }

  return fallbackLimits;
}

export async function savePersistedAppLimitAsync(
  limit: PersistedAppLimitRecord
): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT OR REPLACE INTO app_limits_store (
          id, name, category, limit_minutes, created_at
        ) VALUES (?, ?, ?, ?, ?);`,
        [limit.id, limit.name, limit.category, limit.limit_minutes, limit.created_at || Date.now()]
      );
      return;
    } catch {}
  }

  const idx = fallbackLimits.findIndex((l) => l.id === limit.id);
  if (idx >= 0) {
    fallbackLimits[idx] = limit;
  } else {
    fallbackLimits.push(limit);
  }
  saveFallback(STORAGE_KEYS.limits, fallbackLimits);
}

export async function deletePersistedAppLimitAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM app_limits_store WHERE id = ?;', [id]);
      return;
    } catch {}
  }

  fallbackLimits = fallbackLimits.filter((l) => l.id !== id);
  saveFallback(STORAGE_KEYS.limits, fallbackLimits);
}

/* ========================================================================== */
/* SECTION 6: STUDY & SLEEP SCHEDULES                                         */
/* ========================================================================== */

export async function getPersistedSchedulesAsync(): Promise<ScheduleRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM app_schedules ORDER BY start_time ASC;'
      );
      return (rows as any[]).map((r) => ({
        ...r,
        is_enabled: Boolean(r.is_enabled),
      })) as ScheduleRecord[];
    } catch {}
  }

  return fallbackSchedules;
}

export async function savePersistedScheduleAsync(schedule: ScheduleRecord): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT OR REPLACE INTO app_schedules (
          id, name, type, start_time, end_time, days_active, is_enabled, blocked_apps
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          schedule.id,
          schedule.name,
          schedule.type,
          schedule.start_time,
          schedule.end_time,
          schedule.days_active,
          schedule.is_enabled ? 1 : 0,
          schedule.blocked_apps,
        ]
      );
      return;
    } catch {}
  }

  const idx = fallbackSchedules.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) {
    fallbackSchedules[idx] = schedule;
  } else {
    fallbackSchedules.push(schedule);
  }
  saveFallback(STORAGE_KEYS.schedules, fallbackSchedules);
}

export async function deletePersistedScheduleAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM app_schedules WHERE id = ?;', [id]);
      return;
    } catch {}
  }

  fallbackSchedules = fallbackSchedules.filter((s) => s.id !== id);
  saveFallback(STORAGE_KEYS.schedules, fallbackSchedules);
}

export async function togglePersistedScheduleAsync(id: string): Promise<boolean> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        'UPDATE app_schedules SET is_enabled = CASE WHEN is_enabled = 1 THEN 0 ELSE 1 END WHERE id = ?;',
        [id]
      );
      const row = await nativeDb.getFirstAsync(
        'SELECT is_enabled FROM app_schedules WHERE id = ?;',
        [id]
      );
      return Boolean((row as any)?.is_enabled);
    } catch {}
  }

  const item = fallbackSchedules.find((s) => s.id === id);
  if (item) {
    item.is_enabled = !item.is_enabled;
    saveFallback(STORAGE_KEYS.schedules, fallbackSchedules);
    return item.is_enabled;
  }
  return false;
}

/* ========================================================================== */
/* SECTION 7: USER ACCOUNTS (LOCAL SQLITE AUTH)                              */
/* ========================================================================== */

export async function getPersistedUsersAsync(): Promise<UserAccountRecord[]> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      const rows = await nativeDb.getAllAsync(
        'SELECT * FROM user_accounts ORDER BY created_at ASC;'
      );
      return rows as UserAccountRecord[];
    } catch {}
  }

  return fallbackUsers;
}

export async function savePersistedUserAsync(
  user: UserAccountRecord
): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT OR REPLACE INTO user_accounts (
          id, name, email, password, created_at
        ) VALUES (?, ?, ?, ?, ?);`,
        [user.id, user.name, user.email.toLowerCase(), user.password, user.created_at || Date.now()]
      );
      return;
    } catch {}
  }

  const idx = fallbackUsers.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) {
    fallbackUsers[idx] = user;
  } else {
    fallbackUsers.push(user);
  }
  saveFallback(STORAGE_KEYS.users, fallbackUsers);
}

/* ========================================================================== */
/* SECTION 8: MASTER CLEAR ALL PERSISTED DATA                                 */
/* ========================================================================== */

export async function clearAllPersistedAppDataAsync(): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.execAsync(`
        DELETE FROM sent_notifications;
        DELETE FROM app_daily_usage;
        DELETE FROM focus_sessions;
        DELETE FROM in_app_shields;
        DELETE FROM app_limits_store;
        DELETE FROM app_schedules;
      `);
      return;
    } catch {}
  }

  fallbackNotifications = [];
  fallbackUsage = [];
  fallbackFocus = [];
  fallbackShields = [];
  fallbackLimits = [];
  fallbackSchedules = [];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEYS.notifications);
      window.localStorage.removeItem(STORAGE_KEYS.usage);
      window.localStorage.removeItem(STORAGE_KEYS.focus);
      window.localStorage.removeItem(STORAGE_KEYS.shields);
      window.localStorage.removeItem(STORAGE_KEYS.limits);
      window.localStorage.removeItem(STORAGE_KEYS.schedules);
    } catch {}
  }
}
