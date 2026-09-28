import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { bloodBankService } from '../../services/bloodBankService';
import { BloodBankMap } from '../maps/BloodBankMap';
import { BloodBank, BloodInventoryItem, BloodGroupType, BloodComponentType } from '../../types/database';
import {
  Droplet,
  AlertTriangle,
  Plus,
  Minus,
  Clock,
  Thermometer,
  X,
  Navigation
} from 'lucide-react';

const BLOOD_GROUPS: BloodGroupType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS: { id: BloodComponentType; label: string }[] = [
  { id: 'WHOLE_BLOOD', label: 'Whole Blood' },
  { id: 'PRBC', label: 'PRBC' },
  { id: 'FFP', label: 'FFP' },
  { id: 'PLATELETS', label: 'Platelets' },
  { id: 'CRYOPRECIPITATE', label: 'Cryoprecipitate' },
];

export const BloodBankDashboard: React.FC = () => {
  const [activeBB, setActiveBB] = useState<BloodBank | null>(() => {
    const bbs = dbAdapter.getTable('blood_banks');
    return bbs[0] || null;
  });
  const [inventory, setInventory] = useState<BloodInventoryItem[]>(() => dbAdapter.getTable('blood_inventory'));
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<BloodGroupType | 'ALL'>('ALL');
  const [selectedComponentFilter, setSelectedComponentFilter] = useState<BloodComponentType | 'ALL'>('ALL');

  const [pendingReleaseItem, setPendingReleaseItem] = useState<BloodInventoryItem | null>(null);
  const [releaseReason, setReleaseReason] = useState('Emergency trauma transfusion dispatch');

  const refreshData = useCallback(() => {
    const bbs = dbAdapter.getTable('blood_banks');
    setActiveBB(bbs[0] || null);
    setInventory(dbAdapter.getTable('blood_inventory'));
  }, []);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('blood_banks', refreshData);
    const unsub2 = dbAdapter.subscribe('blood_inventory', refreshData);
    return () => {
      unsub1();
      unsub2();
    };
  }, [refreshData]);

  const handleConfirmRelease = () => {
    if (!pendingReleaseItem) return;
    bloodBankService.updateStock(pendingReleaseItem.id, -1, 0, undefined, releaseReason);
    setPendingReleaseItem(null);
    refreshData();
  };

  const handleAddStock = (invId: string) => {
    bloodBankService.updateStock(invId, 1, 0, undefined, 'Stock received & verified');
    refreshData();
  };

  const lowStockThreshold = activeBB?.low_stock_threshold_units || 5;
  const totalAvailable = inventory.reduce((sum, item) => sum + item.units_available, 0);
  const totalReserved = inventory.reduce((sum, item) => sum + item.units_reserved, 0);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedGroupFilter !== 'ALL' && item.blood_group !== selectedGroupFilter) return false;
      if (selectedComponentFilter !== 'ALL' && item.component !== selectedComponentFilter) return false;
      return true;
    });
  }, [inventory, selectedGroupFilter, selectedComponentFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-md shadow-rose-600/30">
              <Droplet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)]">
                  FDA / State Blood Council Certified
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  Lic: {activeBB?.license_number || 'TN-BB-8812'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                {activeBB?.name || 'Regional Blood Bank & Transfusion Center'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Cold-chain monitored component inventory, voluntary donor reserve, emergency reservations, and inter-hospital courier logistics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-teal-50 px-4 py-2.5 rounded-2xl border border-teal-100 text-xs font-bold text-teal-800">
              <Thermometer className="w-4 h-4 text-[var(--color-primary)]" />
              <span>Cold Storage: 4.0°C Stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Stat Strip: Available, Reserved, Testing, Quarantined ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
            Available Units
          </span>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {totalAvailable}
          </div>
          <span className="text-xs text-[var(--color-text-muted)] block mt-1">Cross-matched &amp; ready</span>
        </div>

        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
            Emergency Reserved
          </span>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {totalReserved}
          </div>
          <span className="text-xs text-[var(--color-text-muted)] block mt-1">Active surgery holds</span>
        </div>

        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
            Testing / NAT Serology
          </span>
          <div className="text-3xl font-black text-blue-600 mt-2">
            12
          </div>
          <span className="text-xs text-[var(--color-text-muted)] block mt-1">Screening in progress</span>
        </div>

        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
            Quarantined
          </span>
          <div className="text-3xl font-black text-slate-500 mt-2">
            2
          </div>
          <span className="text-xs text-[var(--color-text-muted)] block mt-1">Isolated hold</span>
        </div>
      </div>

      {/* ── 3. Blood Group Cards (A+, A-, B+, B-, AB+, AB-, O+, O-) ── */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-default)] pb-4">
          <div>
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">
              Blood Group Inventory Cards
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Select any group to filter detailed component breakdown below
            </p>
          </div>
          {selectedGroupFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedGroupFilter('ALL')}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline"
            >
              Show all groups
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {BLOOD_GROUPS.map((bg) => {
            const groupUnits = inventory
              .filter((i) => i.blood_group === bg)
              .reduce((sum, i) => sum + i.units_available, 0);
            const isSelected = selectedGroupFilter === bg;

            return (
              <button
                key={bg}
                onClick={() => setSelectedGroupFilter(isSelected ? 'ALL' : bg)}
                className={`p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white border-transparent shadow-md'
                    : 'bg-[#F7F8F6] border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:bg-white'
                }`}
              >
                <div className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-rose-600'}`}>
                  {bg}
                </div>
                <div className={`text-xs font-bold mt-1 ${isSelected ? 'text-teal-100' : 'text-[var(--color-text-primary)]'}`}>
                  {groupUnits} Units
                </div>
                <div className={`text-[10px] mt-0.5 uppercase tracking-wider ${isSelected ? 'text-teal-200' : 'text-[var(--color-text-muted)]'}`}>
                  {groupUnits <= 5 ? 'Low' : 'Stocked'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Components Filter Pills & Inventory Matrix ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-muted)] mr-1">Component:</span>
            <button
              onClick={() => setSelectedComponentFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                selectedComponentFilter === 'ALL'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border-default)]'
              }`}
            >
              All Components
            </button>
            {COMPONENTS.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedComponentFilter(comp.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedComponentFilter === comp.id
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border-default)]'
                }`}
              >
                {comp.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[var(--color-text-muted)]">
            Showing {filteredInventory.length} inventory records
          </span>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredInventory.map((item) => {
            const isLow = item.units_available <= lowStockThreshold;
            return (
              <div
                key={item.id}
                className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-rose-600">{item.blood_group}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {item.component.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <div className="text-3xl font-black text-[var(--color-text-primary)]">
                        {item.units_available}
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Available Units</span>
                    </div>

                    {item.units_reserved > 0 && (
                      <div className="text-right">
                        <div className="text-base font-bold text-amber-600">{item.units_reserved}</div>
                        <span className="text-[11px] text-[var(--color-text-muted)]">Reserved</span>
                      </div>
                    )}
                  </div>

                  {item.earliest_expiry_date && (
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 pb-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Exp: {item.earliest_expiry_date}</span>
                    </div>
                  )}

                  {isLow && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 mb-3">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Low Stock Threshold</span>
                    </div>
                  )}
                </div>

                {/* Stock Controls */}
                <div className="pt-3 border-t border-[var(--color-border-muted)] flex items-center gap-2">
                  <button
                    onClick={() => handleAddStock(item.id)}
                    className="lx-btn lx-btn-primary lx-btn-sm flex-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Add</span>
                  </button>
                  <button
                    onClick={() => setPendingReleaseItem(item)}
                    disabled={item.units_available <= 0}
                    className="lx-btn lx-btn-danger lx-btn-sm flex-1 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" /> <span>Release</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Partner Hospital Network Map ── */}
      <div className="rounded-[28px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="p-5 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Partner Hospital Supply &amp; Transfusion Network
            </h3>
          </div>
          <span className="text-xs font-bold text-[var(--color-primary)] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Cold-Chain Active
          </span>
        </div>

        <div className="h-[500px] w-full">
          <BloodBankMap bloodBankId={activeBB?.id} />
        </div>
      </div>

      {/* ── 6. Release Stock Modal ── */}
      {pendingReleaseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)]">
            <button
              onClick={() => setPendingReleaseItem(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-200">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                  Release 1 Unit ({pendingReleaseItem.blood_group})
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Component: {pendingReleaseItem.component.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Select Clinical Release Reason *
                </label>
                <select
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  <option value="Emergency trauma transfusion dispatch">Emergency trauma transfusion dispatch</option>
                  <option value="Inter-hospital clinical transfer">Inter-hospital clinical transfer</option>
                  <option value="Expired / Out of temperature range discard">Expired / Out of temperature range discard</option>
                  <option value="Quality control / Clotted specimen discard">Quality control / Clotted specimen discard</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingReleaseItem(null)}
                  className="lx-btn lx-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRelease}
                  className="lx-btn lx-btn-danger cursor-pointer"
                >
                  Confirm Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
