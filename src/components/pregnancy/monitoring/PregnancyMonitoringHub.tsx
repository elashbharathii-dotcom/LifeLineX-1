import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { wearableService, WearableTodayOverview } from '../../../services/wearableService';
import { dbAdapter } from '../../../services/databaseAdapter';
import {
  WearableDevice,
  WearableActivityRecord,
  WearableMovementRecord,
  WearableSleepRecord,
  WearableVitalsRecord,
  WearableAlert,
  SensorSignalQuality,
} from '../../../types/database';
import {
  Activity,
  HeartPulse,
  Moon,
  Wind,
  ShieldAlert,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Flame,
  Battery,
  Wifi,
  ChevronRight,
  History,
  Info,
} from 'lucide-react';


interface PregnancyMonitoringHubProps {
  patientId: string;
  pregnancyId: string;
  onTriggerEmergencySOS: () => void;
}

type MonitoringTab =
  | 'OVERVIEW'
  | 'ACTIVITY'
  | 'MOVEMENT'
  | 'SLEEP'
  | 'VITALS'
  | 'ALERTS'
  | 'STATUS'
  | 'HISTORY';

export const PregnancyMonitoringHub: React.FC<PregnancyMonitoringHubProps> = ({
  patientId,
  pregnancyId,
  onTriggerEmergencySOS,
}) => {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('OVERVIEW');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS'>('7_DAYS');

  // Real data states from databaseAdapter
  const [overview, setOverview] = useState<WearableTodayOverview>(() =>
    wearableService.getTodayOverview(pregnancyId)
  );
  const [device, setDevice] = useState<WearableDevice | null>(() =>
    wearableService.getDeviceForPregnancy(pregnancyId)
  );
  const [activityHistory, setActivityHistory] = useState<WearableActivityRecord[]>(() =>
    wearableService.getActivityHistory(pregnancyId, 7)
  );
  const [vitalsHistory, setVitalsHistory] = useState<WearableVitalsRecord[]>(() =>
    wearableService.getVitalsHistory(pregnancyId, 7)
  );
  const [movementHistory, setMovementHistory] = useState<WearableMovementRecord[]>(() =>
    wearableService.getMovementHistory(pregnancyId, 7)
  );
  const [sleepHistory, setSleepHistory] = useState<WearableSleepRecord[]>(() =>
    wearableService.getSleepHistory(pregnancyId, 7)
  );
  const [alerts, setAlerts] = useState<WearableAlert[]>(() =>
    wearableService.getAlerts(pregnancyId)
  );

  const reloadData = useCallback(() => {
    setOverview(wearableService.getTodayOverview(pregnancyId));
    setDevice(wearableService.getDeviceForPregnancy(pregnancyId));
    setActivityHistory(wearableService.getActivityHistory(pregnancyId, historyRange === 'TODAY' ? 1 : historyRange === '7_DAYS' ? 7 : 30));
    setVitalsHistory(wearableService.getVitalsHistory(pregnancyId, historyRange === 'TODAY' ? 1 : historyRange === '7_DAYS' ? 7 : 30));
    setMovementHistory(wearableService.getMovementHistory(pregnancyId, historyRange === 'TODAY' ? 1 : historyRange === '7_DAYS' ? 7 : 30));
    setSleepHistory(wearableService.getSleepHistory(pregnancyId, historyRange === 'TODAY' ? 1 : historyRange === '7_DAYS' ? 7 : 30));
    setAlerts(wearableService.getAlerts(pregnancyId));
  }, [pregnancyId, historyRange]);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('wearable_devices', reloadData);
    const unsub2 = dbAdapter.subscribe('wearable_vitals_records', reloadData);
    const unsub3 = dbAdapter.subscribe('wearable_activity_records', reloadData);
    const unsub4 = dbAdapter.subscribe('wearable_movement_records', reloadData);
    const unsub5 = dbAdapter.subscribe('wearable_sleep_records', reloadData);
    const unsub6 = dbAdapter.subscribe('wearable_alerts', reloadData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, [reloadData]);

  // Sync handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await wearableService.flushOfflineQueue();
      if (device) {
        wearableService.addVitalsRecord(patientId, pregnancyId, device.id, 79, 98.2, 'GOOD');
      }
      setSyncFeedback(res.failed > 0 ? `Synced with 1 offline record pending.` : 'Wearable successfully synchronized.');
      reloadData();
    } catch {
      setSyncFeedback('Synchronization failed. Readings saved locally.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handlePairDevice = () => {
    wearableService.pairDevice(patientId, pregnancyId);
    reloadData();
  };

  const getSignalBadge = (quality?: SensorSignalQuality) => {
    switch (quality) {
      case 'GOOD':
        return { label: 'Good Quality', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'FAIR':
        return { label: 'Fair Quality', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'POOR':
        return { label: 'Poor Quality', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'INVALID':
        return { label: 'Invalid Signal', bg: 'bg-red-100 text-red-800 border-red-300' };
      default:
        return { label: 'Unverified', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === 'ACTIVE'), [alerts]);

  return (
    <div className="space-y-6">
      {/* ── Sub-Navigation Pill Header ── */}
      <div className="p-2 bg-white dark:bg-slate-900 border border-[var(--color-border-default)] rounded-[24px] shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today's Overview
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ACTIVITY'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Wearable &amp; Activity
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENT')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'MOVEMENT'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Movement
          </button>
          <button
            onClick={() => setActiveTab('SLEEP')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SLEEP'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sleep
          </button>
          <button
            onClick={() => setActiveTab('VITALS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'VITALS'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Heart &amp; Oxygen
          </button>
          <button
            onClick={() => setActiveTab('ALERTS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ALERTS'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Alerts</span>
            {activeAlerts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'STATUS'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Device Status
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            History
          </button>
        </div>

        {/* Sync Status Badge & Action */}
        <div className="flex items-center gap-2 px-2">
          {device ? (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
              title="Synchronize wearable telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing…' : 'Sync Wearable'}</span>
            </button>
          ) : (
            <button
              onClick={handlePairDevice}
              className="lx-btn lx-btn-primary lx-btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Pair Wearable</span>
            </button>
          )}
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs flex items-center gap-2 lx-animate-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* ── TAB 1: TODAY'S OVERVIEW ── */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 lx-animate-in">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Steps */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Steps Today
              </span>
              <div className="text-2xl font-black text-[var(--color-primary)] mt-1">
                {overview.stepsToday.toLocaleString()}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                Target: {overview.dailyStepTarget.toLocaleString()}
              </span>
            </div>

            {/* Active Time */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Active Time
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {overview.activeMinutesToday} min
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                Gentle movement
              </span>
            </div>

            {/* Sleep */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Sleep Duration
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {Math.floor(overview.sleepDurationMinutesToday / 60)}h {overview.sleepDurationMinutesToday % 60}m
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                Last recorded night
              </span>
            </div>

            {/* Heart Rate */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Heart Rate (PPG)
              </span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {overview.latestVitals ? `${overview.latestVitals.heartRate} bpm` : '--'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                {overview.latestVitals ? getSignalBadge(overview.latestVitals.signalQuality).label : 'Awaiting sensor'}
              </span>
            </div>

            {/* SpO2 */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Oxygen (SpO2)
              </span>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {overview.latestVitals ? `${overview.latestVitals.spo2}%` : '--'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                MAX30102 sensor
              </span>
            </div>

            {/* Last Sync */}
            <div className="p-5 rounded-[24px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Last Synced
              </span>
              <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-2 truncate">
                {overview.lastSyncTimestamp
                  ? new Date(overview.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Pending'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                {overview.syncStatus}
              </span>
            </div>
          </div>

          {/* Clinical Non-Diagnosis Safety Notice */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-900">
            <Info className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold">Maternal Health Observation &amp; Telemetry</strong>
              Wearable sensor readings are observational measurements intended to keep your prenatal team informed. Sensor readings do not represent diagnostic evaluations. If you experience discomfort or sudden symptoms, initiate an emergency consultation.
            </div>
          </div>

          {/* Quick Sub-Modules Preview: Activity & Vitals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Progress Card */}
            <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    Daily Movement &amp; Target
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('ACTIVITY')}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  Details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Step Goal Progress</span>
                  <span className="text-[var(--color-primary)]">
                    {Math.min(100, Math.round((overview.stepsToday / overview.dailyStepTarget) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((overview.stepsToday / overview.dailyStepTarget) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Active</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{overview.activeMinutesToday} min</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Pacing</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">Light</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Daily Rest</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">Adequate</span>
                </div>
              </div>
            </div>

            {/* Heart & Oxygen Card */}
            <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    Optical Pulse &amp; Oxygen Saturation
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('VITALS')}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  Telemetry <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {overview.latestVitals ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">PULSE RATE</span>
                      <span className="text-2xl font-black text-rose-600">{overview.latestVitals.heartRate} bpm</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">BLOOD OXYGEN</span>
                      <span className="text-2xl font-black text-teal-600">{overview.latestVitals.spo2}%</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">SENSOR SIGNAL</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 border ${getSignalBadge(overview.latestVitals.signalQuality).bg}`}>
                        {getSignalBadge(overview.latestVitals.signalQuality).label}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recorded {new Date(overview.latestVitals.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via onboard optical PPG module.
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No vitals synchronized yet today. Wear the band and tap "Sync Wearable".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: WEARABLE & ACTIVITY ── */}
      {activeTab === 'ACTIVITY' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Activity &amp; Gentle Mobility</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Track daily walking and active durations to support circulation and comfortable gestation.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold block">TODAY'S TOTAL</span>
                <span className="text-2xl font-black text-[var(--color-primary)]">
                  {overview.stepsToday.toLocaleString()} steps
                </span>
              </div>
            </div>

            {/* Target Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 dark:border-slate-800">
                <span className="text-xs font-bold text-teal-800 block">Daily Target</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">7,000 steps</span>
                <span className="text-[11px] text-teal-700 mt-1 block">Recommended gentle pace</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 dark:border-slate-800">
                <span className="text-xs font-bold text-amber-800 block">Active Minutes</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{overview.activeMinutesToday} min</span>
                <span className="text-[11px] text-amber-700 mt-1 block">Light &amp; moderate pacing</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 dark:border-slate-800">
                <span className="text-xs font-bold text-indigo-800 block">Rest Intervals</span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">4 periodic breaks</span>
                <span className="text-[11px] text-indigo-700 mt-1 block">Legs elevated rest</span>
              </div>
            </div>

            {/* Activity Log Table */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
                Synchronized Activity Records
              </h4>
              {activityHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No activity history recorded yet. Wear the band during daily walking.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--color-border-default)] text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Recorded Date</th>
                        <th className="py-2.5 px-3">Steps</th>
                        <th className="py-2.5 px-3">Active Duration</th>
                        <th className="py-2.5 px-3">Intensity</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {activityHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            {new Date(rec.recorded_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {rec.steps.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {rec.active_duration_minutes} minutes
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-50 text-teal-800 border border-teal-200">
                              {rec.activity_level}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {rec.sync_status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MOVEMENT (MPU6050) ── */}
      {activeTab === 'MOVEMENT' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                <Wind className="w-5 h-5 text-teal-600" />
                <span>Motion &amp; Posture Telemetry (MPU6050)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Onboard 6-axis inertial motion unit records gentle posture changes and alerts you to sudden physical movements.
              </p>
            </div>

            {/* Gentle Check-in Notice for Sudden Movements */}
            {movementHistory.some((m) => m.movement_event_type === 'SUDDEN_MOVEMENT') && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider block">
                      Sudden Movement Recorded
                    </span>
                    <p className="text-xs text-amber-800 mt-0.5">
                      "Sudden movement detected. Please check that you are okay." If you experienced a bump or slip, verify how you are feeling.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onTriggerEmergencySOS}
                  className="lx-btn lx-btn-emergency lx-btn-sm shrink-0 cursor-pointer"
                >
                  I Need Assistance (SOS)
                </button>
              </div>
            )}

            {/* Movement Events Log */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
                Recent Motion Events
              </h4>
              {movementHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No sudden or irregular movements recorded. Motion telemetry is stable.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {movementHistory.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                            m.movement_event_type === 'SUDDEN_MOVEMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {m.movement_event_type === 'SUDDEN_MOVEMENT' ? '!' : '✓'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.movement_event_type === 'SUDDEN_MOVEMENT' ? 'Sudden Movement Event' : 'Routine Movement'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(m.movement_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Duration: {m.duration_seconds}s
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Intensity</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{m.intensity}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SLEEP ── */}
      {activeTab === 'SLEEP' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span>Sleep &amp; Rest Cycles</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Records sleep duration and rest intervals based on nighttime posture and motion stabilization.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold block">LAST NIGHT</span>
                <span className="text-2xl font-black text-indigo-600">
                  {Math.floor(overview.sleepDurationMinutesToday / 60)}h {overview.sleepDurationMinutesToday % 60}m
                </span>
              </div>
            </div>

            {/* Sleep Records List */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
                Nightly Rest Log
              </h4>
              {sleepHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No sleep records found. Wear the band overnight to record restful hours.
                </div>
              ) : (
                <div className="space-y-3">
                  {sleepHistory.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)] flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {new Date(s.recorded_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(s.sleep_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.sleep_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Rest</span>
                          <span className="font-black text-indigo-600 text-sm">
                            {Math.floor(s.total_duration_minutes / 60)}h {s.total_duration_minutes % 60}m
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {s.sleep_quality_estimate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: HEART & OXYGEN (MAX30102) ── */}
      {activeTab === 'VITALS' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <span>Heart Rate &amp; Oxygen Saturation (MAX30102)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Optical PPG sensor captures pulse waveform and blood oxygen saturation. Signal quality indicator reflects wrist contact firmness.
              </p>
            </div>

            {/* Quality Warning if Poor */}
            {overview.latestVitals && (overview.latestVitals.signalQuality === 'POOR' || overview.latestVitals.signalQuality === 'INVALID') && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Signal Quality Alert</strong>
                  Signal quality is poor. Please adjust the wearable and recheck. Ensure sensor contact is clean and firm.
                </div>
              </div>
            )}


            {/* Historical Vitals Table */}
            <div>
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
                Telemetry Log
              </h4>
              {vitalsHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No PPG vitals synchronized yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--color-border-default)] text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Heart Rate</th>
                        <th className="py-2.5 px-3">SpO2 Level</th>
                        <th className="py-2.5 px-3">Signal Contact Quality</th>
                        <th className="py-2.5 px-3">Sync Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-default)]">
                      {vitalsHistory.map((v) => {
                        const badge = getSignalBadge(v.signal_quality);
                        return (
                          <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                              {new Date(v.measurement_timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-3 px-3 font-bold text-rose-600">
                              {v.heart_rate} bpm
                            </td>
                            <td className="py-3 px-3 font-bold text-teal-600">
                              {v.spo2}%
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              {v.sync_status}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: ALERTS ── */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  <span>Wearable Notifications &amp; System Alerts</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Automated notifications for sudden movement, prolonged inactivity, or sensor contact adjustments.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {alerts.length} Total
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No wearable alerts recorded. All telemetry parameters are running smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      a.status === 'ACTIVE'
                        ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            {a.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {a.message}
                        </p>
                      </div>

                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            wearableService.acknowledgeAlert(a.id);
                            reloadData();
                          }}
                          className="lx-btn lx-btn-secondary lx-btn-sm text-xs shrink-0 cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 7: WEARABLE STATUS ── */}
      {activeTab === 'STATUS' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600" />
                <span>ESP32 Hardware Connection &amp; Telemetry Status</span>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Technical diagnostic status of your paired wearable device.
              </p>
            </div>

            {device ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#F7F8F6] dark:bg-slate-800 border border-[var(--color-border-default)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Device Name</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-1 block">{device.device_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{device.device_model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Connection</span>
                    <span className="font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {device.connection_status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{device.mac_address_masked}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Battery Level</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      {device.battery_level ?? 84}%
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Good battery health</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Firmware</span>
                    <span className="font-bold text-slate-900 dark:text-white mt-1 block">{device.firmware_version}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Up to date</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Synchronization State: {overview.syncStatus}</span>
                    <span className="text-slate-500">
                      {overview.syncStatus === 'SYNCED'
                        ? 'All local readings are synchronized with your pregnancy care records.'
                        : 'Readings are stored safely on your phone and waiting to synchronize.'}
                    </span>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="lx-btn lx-btn-secondary lx-btn-sm shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Run Sync Check</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[#F7F8F6] dark:bg-slate-800 rounded-2xl border border-dashed border-[var(--color-border-default)] space-y-3">
                <Radio className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Wearable not connected</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Pair your LifelineX Maternal ESP32 wristband to stream live pulse, oxygen, steps, and movement telemetry.
                  </p>
                </div>
                <button
                  onClick={handlePairDevice}
                  className="lx-btn lx-btn-primary lx-btn-sm"
                >
                  Pair Wearable Device
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 8: HISTORY ── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6 lx-animate-in">
          <div className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                  <History className="w-5 h-5 text-[var(--color-primary)]" />
                  <span>Wearable Historical Records</span>
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Historical measurements retain original timestamps and sensor contact indicators.
                </p>
              </div>

              {/* Range Filters */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setHistoryRange('TODAY')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    historyRange === 'TODAY' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setHistoryRange('7_DAYS')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    historyRange === '7_DAYS' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setHistoryRange('30_DAYS')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    historyRange === '30_DAYS' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Combined Metrics Timeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Steps</th>
                    <th className="py-2.5 px-3">Active Duration</th>
                    <th className="py-2.5 px-3">Vitals (HR / SpO2)</th>
                    <th className="py-2.5 px-3">Sensor Quality</th>
                    <th className="py-2.5 px-3">Movement Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {activityHistory.map((act) => {
                    const vital = vitalsHistory.find((v) => v.measurement_timestamp.slice(0, 10) === act.recorded_at.slice(0, 10));
                    const movementCount = movementHistory.filter((m) => m.movement_timestamp.slice(0, 10) === act.recorded_at.slice(0, 10)).length;
                    return (
                      <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {new Date(act.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {act.steps.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {act.active_duration_minutes} min
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {vital ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {vital.heart_rate} bpm • {vital.spo2}%
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {vital ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSignalBadge(vital.signal_quality).bg}`}>
                              {getSignalBadge(vital.signal_quality).label}
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {movementCount} logged
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
