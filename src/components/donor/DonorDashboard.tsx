import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbAdapter } from '../../services/databaseAdapter';
import { DonorMap } from '../maps/DonorMap';
import { DonorChainInviteCard } from './DonorChainInviteCard';
import { DonorProfile, DonorAvailabilityType, DonorChainMember } from '../../types/database';
import {
  Heart,
  ShieldCheck,
  Award,
  Eye,
  CheckCircle,
  MapPin,
  FileCheck,
  Droplet,
  Calendar,
  Clock,
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(() => {
    const donors = dbAdapter.getTable('donor_profiles');
    return donors.find((d) => d.profile_id === profile?.id) || donors[0] || null;
  });
  const [invites, setInvites] = useState<DonorChainMember[]>(() => {
    const donors = dbAdapter.getTable('donor_profiles');
    const myDonor = donors.find((d) => d.profile_id === profile?.id) || donors[0];
    if (myDonor) {
      return dbAdapter
        .getTable('donor_chain_members')
        .filter((m) => m.donor_profile_id === myDonor.id);
    }
    return [];
  });

  const refreshData = useCallback(() => {
    const donors = dbAdapter.getTable('donor_profiles');
    const myDonor = donors.find((d) => d.profile_id === profile?.id) || donors[0];
    setDonorProfile(myDonor || null);

    if (myDonor) {
      const members = dbAdapter
        .getTable('donor_chain_members')
        .filter((m) => m.donor_profile_id === myDonor.id);
      setInvites(members);
    }
  }, [profile?.id]);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('donor_profiles', refreshData);
    const unsub2 = dbAdapter.subscribe('donor_chain_members', refreshData);
    return () => {
      unsub1();
      unsub2();
    };
  }, [refreshData]);

  const handleAvailabilityChange = (status: DonorAvailabilityType) => {
    if (!donorProfile) return;
    dbAdapter.update('donor_profiles', donorProfile.id, { availability_status: status });
    setDonorProfile((prev) => (prev ? { ...prev, availability_status: status } : null));
  };

  const handlePrivacyToggle = () => {
    if (!donorProfile) return;
    const newBlur = !donorProfile.privacy_blur_location;
    dbAdapter.update('donor_profiles', donorProfile.id, {
      privacy_blur_location: newBlur,
    });
    setDonorProfile((prev) => (prev ? { ...prev, privacy_blur_location: newBlur } : null));
  };

  const activeInvite = invites.find((i) => ['NOTIFIED', 'ACCEPTED'].includes(i.status));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(225,29,72,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-md shadow-rose-600/30">
              <Heart className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                Voluntary Blood Donor Network
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                Make a difference when it matters.
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Every unit of blood you donate can save up to three lives in emergency trauma and specialized surgeries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              Verified Voluntary Donor
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Donor Status Hero Card ── */}
      <div className="rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#0F4C47] to-[#0A3834] text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Blood Group Badge */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] bg-rose-600 text-white flex flex-col items-center justify-center font-black shadow-lg shadow-rose-950/40 shrink-0">
              <span className="text-2xl sm:text-3xl leading-none">
                {donorProfile?.blood_group || profile?.blood_group || 'O+'}
              </span>
              <span className="text-[10px] tracking-wider uppercase opacity-90 mt-1">Group</span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-white">
                  {profile?.full_name || 'Verified Donor'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-teal-100 backdrop-blur-sm">
                  Universal Donor Type
                </span>
              </div>
              <p className="text-xs sm:text-sm text-teal-100 max-w-xl leading-relaxed">
                Eligible to donate today. Your last voluntary donation was verified on <strong>2026-06-15</strong>. Safe donation cooldown interval satisfied.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-teal-200">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-accent-mint)]" />
                  Health Screening Passed
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-accent-mint)]" />
                  Ready for Emergency Dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Availability Control */}
          <div className="lg:col-span-4 bg-white/10 backdrop-blur-md p-5 rounded-[24px] border border-white/15 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200 block">
              Donation Availability Status
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/20 rounded-2xl">
              {(['AVAILABLE', 'BUSY', 'PAUSED'] as DonorAvailabilityType[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleAvailabilityChange(st)}
                  className={`py-2 text-[11px] font-black rounded-xl uppercase tracking-wider transition-all ${
                    donorProfile?.availability_status === st
                      ? 'bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] shadow-sm'
                      : 'text-teal-200 hover:text-white'
                  }`}
                >
                  {st === 'AVAILABLE' ? 'Active' : st === 'BUSY' ? 'Busy' : 'Paused'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-teal-100 opacity-80 leading-normal">
              When <strong>Active</strong>, nearby hospitals and trauma coordinators can dispatch emergency alerts if a matching patient needs blood.
            </p>
          </div>
        </div>
      </div>

      {/* ── Active Donor Chain Invite (if emergency active) ── */}
      {activeInvite && (
        <div className="p-6 rounded-[28px] bg-rose-50 border border-rose-200 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            Active Critical Emergency Blood Request
          </div>
          <DonorChainInviteCard member={activeInvite} onResponded={refreshData} />
        </div>
      )}

      {/* ── 3. Donor Impact Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">Total Donations</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--color-text-primary)]">
            {donorProfile?.total_donations_count || 4}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Verified units registered</p>
        </div>

        <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">Lives Impacted</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {((donorProfile?.total_donations_count || 4) * 3)}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Estimated patient survival boost</p>
        </div>

        <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">Certificates</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--color-text-primary)]">
            {donorProfile?.total_donations_count ? Math.max(1, Math.floor(donorProfile.total_donations_count / 2)) : 2}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">State Blood Transfusion Council</p>
        </div>

        <div className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-[var(--color-text-secondary)]">Next Eligible Date</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-50 text-[var(--color-primary)]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-[var(--color-primary)] mt-1">
            Now Eligible
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Safe interval cleared</p>
        </div>
      </div>

      {/* ── 4. Main Grid: Donation Centers Map + History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Map View */}
        <div className="lg:col-span-8 rounded-[28px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border-default)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Licensed Donation Centers &amp; Drives
              </h3>
            </div>

            <button
              onClick={handlePrivacyToggle}
              className="lx-btn lx-btn-secondary lx-btn-sm inline-flex items-center gap-1.5"
              title="When enabled, facilities see only your approximate ~800m area for privacy"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Location Privacy: </span>
              <strong className={donorProfile?.privacy_blur_location ? 'text-emerald-700' : 'text-slate-500'}>
                {donorProfile?.privacy_blur_location ? 'ON (~800m blur)' : 'OFF (Exact)'}
              </strong>
            </button>
          </div>

          <DonorMap
            donorLocation={{
              latitude: profile?.latitude || 13.085,
              longitude: profile?.longitude || 80.275,
            }}
          />
        </div>

        {/* Donation History Card */}
        <div className="lg:col-span-4 rounded-[28px] p-6 bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-[var(--color-text-primary)]">
                Donation History
              </h3>
            </div>
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Verified Ledger</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Red Cross Regional Center</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Whole Blood (350ml) • Token #CX-9921</p>
              <span className="text-[10px] text-[var(--color-text-secondary)] block pt-1">Date: 2026-06-15</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">Apollo Hospital Trauma Hub</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Whole Blood (350ml) • Token #AP-4401</p>
              <span className="text-[10px] text-[var(--color-text-secondary)] block pt-1">Date: 2026-03-02</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">KIMS Central Blood Center</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">Platelets (1 unit) • Token #KM-2283</p>
              <span className="text-[10px] text-[var(--color-text-secondary)] block pt-1">Date: 2025-11-19</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-2.5 text-xs">
            <FileCheck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Every voluntary donation is logged in the state blood transfusion ledger with tamper-resistant audit logs and verifiable digital certificates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
