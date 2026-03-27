import { openDB } from 'idb';

const DB_NAME = 'AttendifyXOffline';
const DB_VERSION = 1;

const STORES = {
  ATTENDANCE: 'attendance',
  SESSIONS: 'sessions',
  SYNC_QUEUE: 'sync_queue'
};

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
        const attendanceStore = db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id' });
        attendanceStore.createIndex('session_id', 'session_id');
        attendanceStore.createIndex('student_id', 'student_id');
        attendanceStore.createIndex('synced', 'synced');
      }

      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionsStore.createIndex('session_code', 'session_code');
        sessionsStore.createIndex('qr_token', 'qr_token');
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncQueueStore.createIndex('type', 'type');
        syncQueueStore.createIndex('status', 'status');
      }
    }
  });
}

export async function saveAttendanceOffline(attendanceData) {
  const db = await initDB();
  const record = {
    ...attendanceData,
    synced: false,
    created_at: new Date().toISOString(),
    id: crypto.randomUUID()
  };
  
  await db.put(STORES.ATTENDANCE, record);
  
  await addToSyncQueue({
    type: 'attendance',
    action: 'create',
    data: record,
    status: 'pending'
  });

  return record;
}

export async function saveSessionOffline(sessionData) {
  const db = await initDB();
  const record = {
    ...sessionData,
    synced: false,
    created_at: new Date().toISOString(),
    id: sessionData.id || crypto.randomUUID()
  };
  
  await db.put(STORES.SESSIONS, record);
  return record;
}

export async function getOfflineAttendance() {
  const db = await initDB();
  return await db.getAllFromIndex(STORES.ATTENDANCE, 'synced', false);
}

export async function getOfflineSessions() {
  const db = await initDB();
  return await db.getAll(STORES.SESSIONS);
}

export async function getSessionByCode(sessionCode) {
  const db = await initDB();
  return await db.getFromIndex(STORES.SESSIONS, 'session_code', sessionCode);
}

export async function getSessionByToken(qrToken) {
  const db = await initDB();
  return await db.getFromIndex(STORES.SESSIONS, 'qr_token', qrToken);
}

export async function markAttendanceSynced(attendanceId) {
  const db = await initDB();
  const record = await db.get(STORES.ATTENDANCE, attendanceId);
  if (record) {
    record.synced = true;
    await db.put(STORES.ATTENDANCE, record);
  }
}

export async function addToSyncQueue(item) {
  const db = await initDB();
  return await db.add(STORES.SYNC_QUEUE, {
    ...item,
    created_at: new Date().toISOString()
  });
}

export async function getSyncQueue() {
  const db = await initDB();
  return await db.getAllFromIndex(STORES.SYNC_QUEUE, 'status', 'pending');
}

export async function updateSyncQueueItem(id, updates) {
  const db = await initDB();
  const item = await db.get(STORES.SYNC_QUEUE, id);
  if (item) {
    await db.put(STORES.SYNC_QUEUE, { ...item, ...updates });
  }
}

export async function clearSyncedQueueItems() {
  const db = await initDB();
  const items = await db.getAll(STORES.SYNC_QUEUE);
  for (const item of items) {
    if (item.status === 'completed') {
      await db.delete(STORES.SYNC_QUEUE, item.id);
    }
  }
}

export async function isOnline() {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

export async function syncOfflineData(supabase) {
  if (!await isOnline()) {
    return { success: false, message: 'Offline - sync not possible', synced: 0 };
  }

  try {
    const queue = await getSyncQueue();
    let syncedCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'attendance') {
          const { data, error } = await supabase
            .from('attendance')
            .insert({
              session_id: item.data.session_id,
              student_id: item.data.student_id,
              scanned_at: item.data.scanned_at,
              method: item.data.method
            })
            .select()
            .single();

          if (!error) {
            await markAttendanceSynced(item.data.id);
            await updateSyncQueueItem(item.id, { status: 'completed' });
            syncedCount++;
          }
        }
      } catch (error) {
        console.error('Sync error for item:', item.id, error);
        await updateSyncQueueItem(item.id, { status: 'failed', error: error.message });
      }
    }

    await clearSyncedQueueItems();

    return {
      success: true,
      message: `Synced ${syncedCount} items`,
      synced: syncedCount
    };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, message: error.message, synced: 0 };
  }
}
