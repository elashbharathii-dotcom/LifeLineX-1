// src/services/wearableService.ts
// LifelineX Pregnancy-Only Wearable Monitoring Service
// Coordinates ESP32 (MAX30102 + MPU6050) sync, offline buffering, signal quality, and hospital authorization

import { dbAdapter } from './databaseAdapter';
import {
  WearableDevice,
  WearableActivityRecord,
  WearableMovementRecord,
  WearableSleepRecord,
  WearableVitalsRecord,
  WearableAlert,
  WearableSyncStatus,
  SensorSignalQuality,
  WearableAlertType,
  WearableAlertSeverity,
  PregnancyProfile,
} from '../types/database';

const OFFLINE_QUEUE_KEY = 'lifelinex_wearable_offline_queue';

export interface WearableTodayOverview {
  stepsToday: number;
  dailyStepTarget: number;
  activeMinutesToday: number;
  sleepDurationMinutesToday: number;
  latestVitals: {
    heartRate: number;
    spo2: number;
    signalQuality: SensorSignalQuality;
    timestamp: string;
  } | null;
  movementAlertsCount: number;
  lastSyncTimestamp: string | null;
  syncStatus: WearableSyncStatus;
  device: WearableDevice | null;
}

export interface OfflinePayload {
  id: string;
  patientId: string;
  pregnancyId: string;
  deviceId: string;
  type: 'VITALS' | 'ACTIVITY' | 'MOVEMENT' | 'SLEEP' | 'ALERT';
  data: any;
  recordedAt: string;
}

export const wearableService = {
  // ─── 1. Device Pairing & Management ───────────────────────────────────────
  getDeviceForPregnancy(pregnancyId: string): WearableDevice | null {
    const devices = (dbAdapter.getTable('wearable_devices') || []) as WearableDevice[];
    return devices.find((d) => d.pregnancy_id === pregnancyId) || null;
  },

  pairDevice(patientId: string, pregnancyId: string, deviceName = 'LifelineX Maternal ESP32 Band'): WearableDevice {
    const existing = this.getDeviceForPregnancy(pregnancyId);
    if (existing) {
      return dbAdapter.update('wearable_devices', existing.id, {
        connection_status: 'CONNECTED',
        last_synced_at: new Date().toISOString(),
      });
    }

    const newDevice: WearableDevice = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      pregnancy_id: pregnancyId,
      device_name: deviceName,
      device_model: 'ESP32-MAX30102-MPU6050',
      mac_address_masked: 'C4:4F:33:**:**:' + Math.floor(10 + Math.random() * 89),
      battery_level: 95,
      connection_status: 'CONNECTED',
      last_synced_at: new Date().toISOString(),
      firmware_version: 'v1.4.2-rel',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return dbAdapter.insert('wearable_devices', newDevice);
  },

  disconnectDevice(deviceId: string): void {
    dbAdapter.update('wearable_devices', deviceId, {
      connection_status: 'DISCONNECTED',
      updated_at: new Date().toISOString(),
    });
  },

  // ─── 2. Offline Queue & Synchronization ───────────────────────────────────
  getOfflineQueue(): OfflinePayload[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  queueOfflineRecord(record: OfflinePayload): void {
    const queue = this.getOfflineQueue();
    queue.push(record);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to store wearable offline queue', e);
    }
  },

  async flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    const remaining: OfflinePayload[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'VITALS') {
          dbAdapter.insert('wearable_vitals_records', {
            ...item.data,
            sync_status: 'SYNCED',
            synced_at: new Date().toISOString(),
          });
        } else if (item.type === 'ACTIVITY') {
          dbAdapter.insert('wearable_activity_records', {
            ...item.data,
            sync_status: 'SYNCED',
            synced_at: new Date().toISOString(),
          });
        } else if (item.type === 'MOVEMENT') {
          dbAdapter.insert('wearable_movement_records', {
            ...item.data,
            sync_status: 'SYNCED',
            synced_at: new Date().toISOString(),
          });
        } else if (item.type === 'SLEEP') {
          dbAdapter.insert('wearable_sleep_records', {
            ...item.data,
            sync_status: 'SYNCED',
            synced_at: new Date().toISOString(),
          });
        } else if (item.type === 'ALERT') {
          dbAdapter.insert('wearable_alerts', item.data);
        }
        synced++;
      } catch {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    } catch {
      // Ignored
    }

    return { synced, failed: remaining.length };
  },

  // ─── 3. Ingestion Methods ─────────────────────────────────────────────────
  addVitalsRecord(
    patientId: string,
    pregnancyId: string,
    deviceId: string,
    heartRate: number,
    spo2: number,
    signalQuality: SensorSignalQuality,
    isOnline = true
  ): WearableVitalsRecord {
    const record: WearableVitalsRecord = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      pregnancy_id: pregnancyId,
      device_id: deviceId,
      heart_rate: heartRate,
      spo2: spo2,
      signal_quality: signalQuality,
      measurement_timestamp: new Date().toISOString(),
      synced_at: isOnline ? new Date().toISOString() : undefined,
      sync_status: isOnline ? 'SYNCED' : 'LOCAL_ONLY',
      source: 'BLE',
      created_at: new Date().toISOString(),
    };

    if (isOnline) {
      dbAdapter.insert('wearable_vitals_records', record);
    } else {
      this.queueOfflineRecord({
        id: record.id,
        patientId,
        pregnancyId,
        deviceId,
        type: 'VITALS',
        data: record,
        recordedAt: record.measurement_timestamp,
      });
    }

    // Generate sensor quality alert if poor or invalid
    if (signalQuality === 'POOR' || signalQuality === 'INVALID') {
      this.createAlert(
        patientId,
        pregnancyId,
        deviceId,
        'POOR_SENSOR_QUALITY',
        'WARNING',
        'Sensor Contact Warning',
        'Signal quality is poor or irregular. Please adjust the wearable comfortably against your skin and verify sensor cleanliness.'
      );
    }

    // Update last sync on device
    dbAdapter.update('wearable_devices', deviceId, {
      last_synced_at: new Date().toISOString(),
      connection_status: 'CONNECTED',
    });

    return record;
  },

  addMovementEvent(
    patientId: string,
    pregnancyId: string,
    deviceId: string,
    eventType: 'ROUTINE' | 'SUDDEN_MOVEMENT' | 'PROLONGED_INACTIVITY',
    intensity: number,
    durationSeconds = 5
  ): WearableMovementRecord {
    const record: WearableMovementRecord = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      pregnancy_id: pregnancyId,
      device_id: deviceId,
      movement_event_type: eventType,
      intensity,
      duration_seconds: durationSeconds,
      movement_timestamp: new Date().toISOString(),
      synced_at: new Date().toISOString(),
      sync_status: 'SYNCED',
      source: 'BLE',
      created_at: new Date().toISOString(),
    };

    dbAdapter.insert('wearable_movement_records', record);

    if (eventType === 'SUDDEN_MOVEMENT') {
      this.createAlert(
        patientId,
        pregnancyId,
        deviceId,
        'SUDDEN_MOVEMENT',
        'WARNING',
        'Sudden Movement Detected',
        'A sudden movement was recorded. Please check that you are feeling okay. If you need assistance, your emergency guardians or obstetric dispatch can be notified.'
      );
    }

    return record;
  },

  createAlert(
    patientId: string,
    pregnancyId: string,
    deviceId: string,
    alertType: WearableAlertType,
    severity: WearableAlertSeverity,
    title: string,
    message: string
  ): WearableAlert {
    const alert: WearableAlert = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      pregnancy_id: pregnancyId,
      device_id: deviceId,
      alert_type: alertType,
      severity,
      title,
      message,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      source: 'ESP32_SENSOR_HUB',
    };
    return dbAdapter.insert('wearable_alerts', alert);
  },

  // ─── 4. Queries (Pregnancy-Scoped) ────────────────────────────────────────
  getTodayOverview(pregnancyId: string): WearableTodayOverview {
    const device = this.getDeviceForPregnancy(pregnancyId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startIso = startOfDay.toISOString();

    const activityRecords = ((dbAdapter.getTable('wearable_activity_records') || []) as WearableActivityRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId);

    const todayActivities = activityRecords.filter((r) => r.recorded_at >= startIso);
    const stepsToday = todayActivities.reduce((acc, r) => acc + (r.steps || 0), 0);
    const activeMinutesToday = todayActivities.reduce((acc, r) => acc + (r.active_duration_minutes || 0), 0);

    const sleepRecords = ((dbAdapter.getTable('wearable_sleep_records') || []) as WearableSleepRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    const latestSleep = sleepRecords[0];

    const vitalsRecords = ((dbAdapter.getTable('wearable_vitals_records') || []) as WearableVitalsRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId)
      .sort((a, b) => new Date(b.measurement_timestamp).getTime() - new Date(a.measurement_timestamp).getTime());
    const latestVitals = vitalsRecords[0]
      ? {
          heartRate: vitalsRecords[0].heart_rate,
          spo2: vitalsRecords[0].spo2,
          signalQuality: vitalsRecords[0].signal_quality,
          timestamp: vitalsRecords[0].measurement_timestamp,
        }
      : null;

    const movementAlertsCount = ((dbAdapter.getTable('wearable_alerts') || []) as WearableAlert[])
      .filter((a) => a.pregnancy_id === pregnancyId && a.alert_type === 'SUDDEN_MOVEMENT' && a.created_at >= startIso)
      .length;

    const queue = this.getOfflineQueue().filter((q) => q.pregnancyId === pregnancyId);
    const syncStatus: WearableSyncStatus = queue.length > 0 ? 'PENDING_SYNC' : 'SYNCED';

    return {
      stepsToday,
      dailyStepTarget: 7000,
      activeMinutesToday,
      sleepDurationMinutesToday: latestSleep ? latestSleep.total_duration_minutes : 0,
      latestVitals,
      movementAlertsCount,
      lastSyncTimestamp: device?.last_synced_at || null,
      syncStatus,
      device,
    };
  },

  getActivityHistory(pregnancyId: string, days = 7): WearableActivityRecord[] {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return ((dbAdapter.getTable('wearable_activity_records') || []) as WearableActivityRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId && r.recorded_at >= since)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  },

  getVitalsHistory(pregnancyId: string, days = 7): WearableVitalsRecord[] {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return ((dbAdapter.getTable('wearable_vitals_records') || []) as WearableVitalsRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId && r.measurement_timestamp >= since)
      .sort((a, b) => new Date(b.measurement_timestamp).getTime() - new Date(a.measurement_timestamp).getTime());
  },

  getMovementHistory(pregnancyId: string, days = 7): WearableMovementRecord[] {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return ((dbAdapter.getTable('wearable_movement_records') || []) as WearableMovementRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId && r.movement_timestamp >= since)
      .sort((a, b) => new Date(b.movement_timestamp).getTime() - new Date(a.movement_timestamp).getTime());
  },

  getSleepHistory(pregnancyId: string, days = 7): WearableSleepRecord[] {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return ((dbAdapter.getTable('wearable_sleep_records') || []) as WearableSleepRecord[])
      .filter((r) => r.pregnancy_id === pregnancyId && r.recorded_at >= since)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  },

  getAlerts(pregnancyId: string): WearableAlert[] {
    return ((dbAdapter.getTable('wearable_alerts') || []) as WearableAlert[])
      .filter((a) => a.pregnancy_id === pregnancyId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  acknowledgeAlert(alertId: string): void {
    dbAdapter.update('wearable_alerts', alertId, {
      status: 'ACKNOWLEDGED',
      acknowledged_at: new Date().toISOString(),
    });
  },

  resolveAlert(alertId: string): void {
    dbAdapter.update('wearable_alerts', alertId, {
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
    });
  },

  // ─── 5. Hospital Clinical Authorization Guard ─────────────────────────────
  // Validates that the requested pregnant patient is linked to the requesting hospital
  getHospitalWearableMetrics(hospitalId: string, linkedPregnancies?: PregnancyProfile[]): {
    linkedPatientsCount: number;
    monitoringActiveCount: number;
    monitoringOfflineCount: number;
    alertsRequiringReviewCount: number;
  } {
    const allPregnancies = linkedPregnancies || ((dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[])
      .filter((p) => p.hospital_id === hospitalId && p.status !== 'ARCHIVED');
    
    const devices = (dbAdapter.getTable('wearable_devices') || []) as WearableDevice[];
    const alerts = (dbAdapter.getTable('wearable_alerts') || []) as WearableAlert[];


    const linkedPregnancyIds = new Set(allPregnancies.map((p) => p.id));
    
    let monitoringActiveCount = 0;
    let monitoringOfflineCount = 0;

    allPregnancies.forEach((preg) => {
      const dev = devices.find((d) => d.pregnancy_id === preg.id);
      if (dev && dev.connection_status === 'CONNECTED') {
        monitoringActiveCount++;
      } else {
        monitoringOfflineCount++;
      }
    });

    const alertsRequiringReviewCount = alerts.filter(
      (a) => linkedPregnancyIds.has(a.pregnancy_id) && (a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
    ).length;

    return {
      linkedPatientsCount: allPregnancies.length,
      monitoringActiveCount,
      monitoringOfflineCount,
      alertsRequiringReviewCount,
    };
  },

  getHospitalPatientWearableSummary(
    hospitalId: string,
    pregnancyId: string
  ): { authorized: boolean; overview?: WearableTodayOverview; alerts?: WearableAlert[] } {
    const allPregnancies = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    const targetPregnancy = allPregnancies.find((p) => p.id === pregnancyId);

    if (!targetPregnancy || targetPregnancy.hospital_id !== hospitalId || targetPregnancy.status === 'ARCHIVED') {
      return { authorized: false };
    }

    const overview = this.getTodayOverview(pregnancyId);
    const alerts = this.getAlerts(pregnancyId);

    return {
      authorized: true,
      overview,
      alerts,
    };
  },

  getHospitalPatientDetailedTelemetry(
    hospitalId: string,
    pregnancyId: string
  ): {
    authorized: boolean;
    vitals?: WearableVitalsRecord[];
    movement?: WearableMovementRecord[];
    sleep?: WearableSleepRecord[];
    activity?: WearableActivityRecord[];
  } {
    const allPregnancies = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    const targetPregnancy = allPregnancies.find((p) => p.id === pregnancyId);

    if (!targetPregnancy || targetPregnancy.hospital_id !== hospitalId || targetPregnancy.status === 'ARCHIVED') {
      return { authorized: false };
    }

    return {
      authorized: true,
      vitals: this.getVitalsHistory(pregnancyId, 30),
      movement: this.getMovementHistory(pregnancyId, 30),
      sleep: this.getSleepHistory(pregnancyId, 30),
      activity: this.getActivityHistory(pregnancyId, 30),
    };
  },
};

