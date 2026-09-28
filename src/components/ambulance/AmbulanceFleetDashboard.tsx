import React, { useState, useEffect, useMemo } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { ambulanceService } from '../../services/ambulanceService';
import { Ambulance, Driver, AmbulanceRequest } from '../../types/database';
import {
  Truck,
  ShieldCheck,
  Search,
  Filter,
  PhoneCall,
} from 'lucide-react';

export const AmbulanceFleetDashboard: React.FC = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => dbAdapter.getTable('ambulances'));
  const [drivers, setDrivers] = useState<Driver[]>(() => ambulanceService.getDrivers());
  const [requests, setRequests] = useState<AmbulanceRequest[]>(() => dbAdapter.getTable('ambulance_requests'));
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const refreshData = () => {
      setAmbulances(dbAdapter.getTable('ambulances'));
      setDrivers(ambulanceService.getDrivers());
      setRequests(dbAdapter.getTable('ambulance_requests'));
    };
    const unsub1 = dbAdapter.subscribe('ambulances', refreshData);
    const unsub2 = dbAdapter.subscribe('ambulance_requests', refreshData);
    const unsub3 = dbAdapter.subscribe('drivers', refreshData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const filteredAmbulances = useMemo(() => {
    return ambulances.filter((a) => {
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.vehicle_number.toLowerCase().includes(q) ||
          a.vehicle_type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ambulances, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: ambulances.length,
      available: ambulances.filter((a) => a.status === 'AVAILABLE').length,
      busy: ambulances.filter((a) => ['REQUESTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRANSPORTING'].includes(a.status)).length,
      offline: ambulances.filter((a) => a.status === 'OFFLINE').length,
    };
  }, [ambulances]);

  return (
    <div className="space-y-6">
      {/* ── 1. Fleet Overview Header ────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[var(--color-border-default)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
            Regional Telemetry &amp; Fleet Logistics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            Ambulance Fleet &amp; Dispatch Command
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1.5 max-w-xl">
            Real-time telemetry, driver status, satellite GPS tracking, and active emergency transport monitoring.
          </p>
        </div>

        {/* Fleet KPI Badges */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs">
            <span className="text-[var(--color-text-secondary)] block">Total Units</span>
            <strong className="text-base font-black text-[var(--color-text-primary)]">{stats.total}</strong>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 block">Available</span>
            <strong className="text-base font-black text-emerald-800">{stats.available}</strong>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
            <span className="text-amber-700 block">Active Trips</span>
            <strong className="text-base font-black text-amber-800">{stats.busy}</strong>
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Search Bar ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle number or type..."
            className="w-full h-11 rounded-2xl pl-11 pr-4 text-xs bg-[#F7F8F6] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 rounded-2xl px-4 text-xs font-bold bg-[#F7F8F6] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
          >
            <option value="ALL">All Statuses ({ambulances.length})</option>
            <option value="AVAILABLE">Available ({stats.available})</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="TRANSPORTING">Transporting</option>
            <option value="OFFLINE">Offline ({stats.offline})</option>
          </select>
        </div>
      </div>

      {/* ── 3. Fleet Vehicle Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAmbulances.map((amb) => {
          const assignedDriver = drivers.find((d) => d.assigned_ambulance_id === amb.id);
          const activeTrip = requests.find((r) => r.assigned_ambulance_id === amb.id && !['COMPLETED', 'CANCELLED'].includes(r.status));
          const freshness = ambulanceService.evaluateGpsFreshness(amb.last_gps_update);

          return (
            <div
              key={amb.id}
              className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {amb.vehicle_number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      amb.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {amb.status}
                  </span>
                </div>

                <h3 className="text-base font-black text-[var(--color-text-primary)]">{amb.vehicle_type.replace(/_/g, ' ')}</h3>
                <div className="text-xs mt-1.5 flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Driver: {assignedDriver?.profile?.full_name || 'Assigned on Dispatch'}</span>
                </div>

                {/* Telemetry Block */}
                <div className="mt-4 p-4 rounded-2xl text-xs space-y-2 bg-[#F7F8F6] border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">GPS Signal:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {freshness.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Current Speed:</span>
                    <span className="font-mono font-bold text-[var(--color-text-primary)]">{amb.current_speed_kmh || 0} km/h</span>
                  </div>
                  {activeTrip && (
                    <div className="pt-2 flex items-center justify-between border-t border-[var(--color-border-default)]">
                      <span className="font-bold text-rose-700">Active Emergency Trip:</span>
                      <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{activeTrip.request_code}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 flex items-center justify-between text-xs border-t border-[var(--color-border-default)]">
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  [{amb.current_latitude?.toFixed(3) || '13.080'}, {amb.current_longitude?.toFixed(3) || '80.260'}]
                </span>
                {assignedDriver?.profile?.phone && (
                  <a
                    href={`tel:${assignedDriver.profile.phone}`}
                    className="font-bold flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call Driver
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
