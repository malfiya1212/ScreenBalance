export interface SentNotificationRecord {
  id: string;
  app_id: string;
  app_name: string;
  threshold: number;
  date_key: string; // e.g. "2026-11-18"
  remaining_minutes: number;
  limit_minutes: number;
  title: string;
  message: string;
  severity: string;
  sent_at: number;
}

export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fallback in-memory/localStorage store for Web environments where WASM is unavailable
const LOCAL_STORAGE_KEY = 'sb_sqlite_sent_notifications';

const loadFallbackRecords = (): SentNotificationRecord[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Safe fail
    }
  }
  return [];
};

const saveFallbackRecords = (records: SentNotificationRecord[]) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Safe fail
    }
  }
};

let fallbackStore: SentNotificationRecord[] = loadFallbackRecords();

let nativeDb: any = null;
let isNativeDbReady = false;
let dbInitializationPromise: Promise<boolean> | null = null;

/**
 * Initializes the SQLite Database and creates the sent_notifications table
 * with a UNIQUE constraint on (app_id, threshold, date_key) to prevent duplicate notifications.
 */
export async function initSqliteAsync(): Promise<boolean> {
  if (isNativeDbReady) return true;
  if (dbInitializationPromise) return dbInitializationPromise;

  dbInitializationPromise = (async () => {
    try {
      // Dynamically require expo-sqlite to support all platforms smoothly
      const SQLite = await import('expo-sqlite');

      nativeDb = await SQLite.openDatabaseAsync('screenbalance_notifications.db');

      // Create table with UNIQUE constraint preventing duplicate alerts
      await nativeDb.execAsync(`
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
      `);

      isNativeDbReady = true;
      return true;
    } catch {
      // Fallback to storage emulator with identical SQLite schema and uniqueness checks
      isNativeDbReady = false;
      fallbackStore = loadFallbackRecords();
      return true;
    }
  })();

  return dbInitializationPromise;
}

/**
 * Checks SQLite to determine if a notification has already been sent
 * for a specific app, threshold milestone, and date.
 */
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
    } catch {
      // Fallback if query fails
    }
  }

  // Fallback store check
  return fallbackStore.some(
    (item) =>
      item.app_id === appId &&
      item.threshold === threshold &&
      item.date_key === dateKey
  );
}

/**
 * Inserts a sent notification record into SQLite.
 * Returns true if inserted successfully, false if duplicate was prevented.
 */
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
      // Unique constraint violation (SQLITE_CONSTRAINT or similar) means already sent
      if (e?.message?.includes('UNIQUE') || e?.message?.includes('constraint')) {
        return false;
      }
      // If error is other, fallback
    }
  }

  // Fallback store check uniqueness constraint
  const alreadyExists = fallbackStore.some(
    (item) =>
      item.app_id === record.app_id &&
      item.threshold === record.threshold &&
      item.date_key === record.date_key
  );

  if (alreadyExists) {
    return false; // Prevent duplicate!
  }

  fallbackStore.unshift(record);
  saveFallbackRecords(fallbackStore);
  return true;
}

/**
 * Retrieves all sent notification records from SQLite, optionally filtered by date.
 */
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
    } catch {
      // Fallback
    }
  }

  if (dateKey) {
    return fallbackStore.filter((r) => r.date_key === dateKey);
  }
  return fallbackStore;
}

/**
 * Deletes a sent notification record by id.
 */
export async function deleteSentNotificationByIdAsync(id: string): Promise<void> {
  await initSqliteAsync();

  if (isNativeDbReady && nativeDb) {
    try {
      await nativeDb.runAsync('DELETE FROM sent_notifications WHERE id = ?;', [id]);
      return;
    } catch {
      // Fallback
    }
  }

  fallbackStore = fallbackStore.filter((r) => r.id !== id);
  saveFallbackRecords(fallbackStore);
}

/**
 * Clears all sent notification records in SQLite (or for a specific date).
 */
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
    } catch {
      // Fallback
    }
  }

  if (dateKey) {
    fallbackStore = fallbackStore.filter((r) => r.date_key !== dateKey);
  } else {
    fallbackStore = [];
  }
  saveFallbackRecords(fallbackStore);
}
