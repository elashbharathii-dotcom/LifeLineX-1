import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { ambulanceService } from '../../services/ambulanceService';
import { locationService, GeoLocationState } from '../../services/locationService';
import { AmbulanceMap } from '../maps/AmbulanceMap';
import { Ambulance, AmbulanceRequest, Driver, AmbulanceStatusType } from '../../types/database';
import {
  Truck,
  Navigation,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TRIP_STEPS: { status: AmbulanceStatusType; label: string }[] = [
  { status: 'REQUESTED', label: 'Requested' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'EN_ROUTE', label: 'En Route to Pickup' },
  { status: 'ARRIVED', label: 'Arrived at Pickup' },
  { status: 'TRANSPORTING', label: 'Transporting to Hospital' },
  { status: 'COMPLETED', label: 'Trip Completed' },
];

export const AmbulanceDriverView: React.FC = () => {
  const [driver, setDriver] = useState<Driver | null>(() => {
    const drivers = ambulanceService.getDrivers();
    return drivers[0] || null;
  });
  const [ambulance, setAmbulance] = useState<Ambulance | null>(() => {
    const drivers = ambulanceService.getDrivers();
    const myDriver = drivers[0];
    if (myDriver?.assigned_ambulance_id) {
      return dbAdapter.getTable('ambulances').find((a) => a.id === myDriver.assigned_ambulance_id) || null;
    }
    return null;
  });
  const [activeTrip, setActiveTrip] = useState<AmbulanceRequest | null>(() => {
    const requests = dbAdapter.getTable('ambulance_requests');
    return requests.find((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)) || null;
  });
  const [isStreamingGps, setIsStreamingGps] = useState(false);
  const [, setGpsState] = useState<GeoLocationState>(locationService.getCurrentState());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const drivers = ambulanceService.getDrivers();
    const myDriver = drivers[0];
    setDriver(myDriver || null);

    if (myDriver?.assigned_ambulance_id) {
      const amb = dbAdapter.getTable('ambulances').find((a) => a.id === myDriver.assigned_ambulance_id);
      setAmbulance(amb || null);
    }

    const requests = dbAdapter.getTable('ambulance_requests');
    const active = requests.find((r) => !['COMPLETED', 'CANCELLED'].includes(r.status));
    setActiveTrip(active || null);
  }, []);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('ambulance_requests', loadData);
    const unsub2 = dbAdapter.subscribe('ambulances', loadData);
    const unsub3 = locationService.subscribe((loc) => {
      setGpsState(loc);
      if (isStreamingGps && ambulance && driver) {
        ambulanceService.streamDriverGPS({
          ambulanceId: ambulance.id,
          driverId: driver.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading || 0,
          speedKmh: loc.speed ? loc.speed * 3.6 : 0,
          accuracyMeters: loc.accuracy || 10,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [isStreamingGps, ambulance, driver, loadData]);

  const toggleGps = () => {
    if (isStreamingGps) {
      locationService.stopLiveTracking();
      setIsStreamingGps(false);
    } else {
      const started = locationService.startLiveTracking();
      setIsStreamingGps(started);
      if (!started) {
        setStatusMessage('GPS Permission Denied. Please enable location in your device settings.');
      }
    }
  };

  const handleTripTransition = (nextStatus: AmbulanceStatusType) => {
    if (!activeTrip || !driver) return;
    const result = ambulanceService.updateTripStatus(activeTrip.id, nextStatus, driver.id);
    if (result.success) {
      if (nextStatus === 'COMPLETED') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0f4c47', '#e2f2a4', '#10b981'],
        });
      }
      setStatusMessage(null);
    } else {
      setStatusMessage(result.message || 'Invalid transition');
    }
    loadData();
  };

  // ETA to current destination
  const etaCalc = useMemo(() => {
    if (!activeTrip || !ambulance?.current_latitude || !ambulance?.current_longitude) return null;
    const targetLat = activeTrip.status === 'TRANSPORTING' ? activeTrip.destination_latitude : activeTrip.pickup_latitude;
    const targetLon = activeTrip.status === 'TRANSPORTING' ? activeTrip.destination_longitude : activeTrip.pickup_longitude;
    if (!targetLat || !targetLon) return null;

    return ambulanceService.calculateRealisticEta(
      ambulance.current_latitude,
      ambulance.current_longitude,
      targetLat,
      targetLon,
      ambulance.current_speed_kmh || 45
    );
  }, [activeTrip, ambulance]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)]">
                  ALS Emergency Fleet
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  On Duty Responders
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                {driver?.profile?.full_name || 'Emergency Response Driver'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Unit:{' '}
                <strong className="font-mono text-[var(--color-text-primary)]">
                  {ambulance?.vehicle_number || 'TN-01-EM-1080'}
                </strong>{' '}
                • {ambulance?.vehicle_type?.replace(/_/g, ' ') || 'ADVANCED LIFE SUPPORT (ALS)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleGps}
              className={`lx-btn ${
                isStreamingGps
                  ? 'lx-btn-emergency'
                  : 'lx-btn-primary'
              } cursor-pointer`}
            >
              {isStreamingGps ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Pause GPS Broadcast</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Live GPS Stream</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ── 2. Active Trip & Visual Status Progression ── */}
      {activeTrip ? (
        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-default)] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">
                  CODE: {activeTrip.request_code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                  {activeTrip.severity} TRAUMA
                </span>
              </div>
              <h2 className="text-2xl font-black text-[var(--color-text-primary)]">
                Active Dispatch: {activeTrip.patient_name || 'Emergency Patient'}
              </h2>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-[var(--color-text-muted)] block uppercase">Calculated ETA</span>
              <div className="text-2xl font-black text-emerald-700">
                {etaCalc ? etaCalc.label : 'ETA Calculating...'}
              </div>
            </div>
          </div>

          {/* Visual Status Progression Timeline (6 Steps) */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
              Trip Status Progression
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {TRIP_STEPS.map((step, idx) => {
                const currentIdx = TRIP_STEPS.findIndex((s) => s.status === activeTrip.status);
                const isPast = currentIdx >= idx;
                const isCurrent = activeTrip.status === step.status;

                return (
                  <div
                    key={step.status}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-[var(--color-primary)] text-white border-transparent shadow-md'
                        : isPast
                        ? 'bg-teal-50 text-[var(--color-primary)] border-teal-200'
                        : 'bg-[#F7F8F6] text-slate-400 border-[var(--color-border-default)]'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold uppercase opacity-80">STEP {idx + 1}</div>
                    <div className="text-xs font-black mt-1 leading-snug">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Transition Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {activeTrip.status === 'REQUESTED' && (
              <button
                onClick={() => handleTripTransition('ACCEPTED')}
                className="lx-btn lx-btn-primary cursor-pointer"
              >
                Accept Emergency Dispatch
              </button>
            )}

            {activeTrip.status === 'ACCEPTED' && (
              <button
                onClick={() => handleTripTransition('EN_ROUTE')}
                className="lx-btn lx-btn-warning cursor-pointer"
              >
                Mark: En Route to Scene
              </button>
            )}

            {activeTrip.status === 'EN_ROUTE' && (
              <button
                onClick={() => handleTripTransition('ARRIVED')}
                className="lx-btn lx-btn-primary cursor-pointer"
              >
                Mark: Arrived at Pickup
              </button>
            )}

            {activeTrip.status === 'ARRIVED' && (
              <button
                onClick={() => handleTripTransition('TRANSPORTING')}
                className="lx-btn lx-btn-primary cursor-pointer"
              >
                Begin Patient Transport to ER
              </button>
            )}

            {activeTrip.status === 'TRANSPORTING' && (
              <button
                onClick={() => handleTripTransition('COMPLETED')}
                className="lx-btn lx-btn-success cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Clinical Handover</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-2">
          <Truck className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Vehicle in Standby Readiness
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
            No active dispatch currently assigned to unit {ambulance?.vehicle_number}. Maintain live GPS streaming to remain discoverable by metro EMS dispatchers.
          </p>
        </div>
      )}

      {/* ── 3. Map View: Live GPS Routing ── */}
      <div className="rounded-[28px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="p-5 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Live Ambulance Telemetry &amp; Navigation
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--color-primary)] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Speed: {ambulance?.current_speed_kmh || 0} km/h
          </span>
        </div>

        <div className="h-[550px] w-full">
          <AmbulanceMap activeAssignment={activeTrip} />
        </div>
      </div>
    </div>
  );
};
