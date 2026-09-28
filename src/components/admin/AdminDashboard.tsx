import React, { useState, useEffect } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { AdminMap } from '../maps/AdminMap';
import { DonorProfile, AuditLog, Profile } from '../../types/database';
import { Shield, CheckCircle, XCircle, FileText, Database, Users, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminDashboard: React.FC = () => {
  const [donorProfiles, setDonorProfiles] = useState<DonorProfile[]>(() => dbAdapter.getTable('donor_profiles'));
  const [profiles, setProfiles] = useState<Profile[]>(() => dbAdapter.getTable('profiles'));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => dbAdapter.getTable('audit_logs'));

  useEffect(() => {
    const refreshData = () => {
      setDonorProfiles(dbAdapter.getTable('donor_profiles'));
      setProfiles(dbAdapter.getTable('profiles'));
      setAuditLogs(dbAdapter.getTable('audit_logs'));
    };
    const unsub = dbAdapter.subscribe('*', refreshData);
    return () => unsub();
  }, []);

  const handleVerifyDonor = (donorId: string, verified: boolean) => {
    dbAdapter.update('donor_profiles', donorId, {
      verification_status: verified ? 'VERIFIED' : 'REJECTED',
    });
    if (verified) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('Reset all databases and tables to standard production seed state?')) {
      dbAdapter.resetToSeed();
    }
  };

  return (
    <div className="space-y-6 lx-animate-in">
      {/* Admin Header */}
      <div className="lx-role-hero" style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-border-default)',
      }}>
        {/* subtle purple radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.08) 0%, transparent 65%)', borderRadius: 'inherit', pointerEvents: 'none' }} />
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="lx-role-hero-icon"
            style={{ background: 'rgba(99,102,241,0.10)', borderColor: 'rgba(99,102,241,0.25)', color: '#6366f1' }}
          >
            <Shield className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="lx-role-hero-title">Master Administration Console</h1>
              <span className="lx-badge" style={{ background: 'rgba(99,102,241,0.10)', borderColor: 'rgba(99,102,241,0.25)', color: '#6366f1' }}>
                System Auditor &amp; KYC
              </span>
            </div>
            <p className="lx-role-hero-sub">
              Platform Governance, Organization Licensing, Verification Reviews &amp; Real-Time Audit Logs
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDatabase}
          className="lx-btn lx-btn-secondary lx-btn-sm relative z-10"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset to Clean Seed
        </button>
      </div>

      {/* Grid: Admin Map + Verification Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oversight Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="lx-panel">
            <h2 className="lx-panel-title mb-3">
              <Database className="w-4 h-4" style={{ color: '#818cf8' }} />
              Aggregate Statewide Operational Grid
            </h2>
            <AdminMap />
          </div>

          {/* Audit Logs Table */}
          <div className="lx-panel">
            <h2 className="lx-panel-title mb-3">
              <FileText className="w-4 h-4" style={{ color: 'var(--color-success-light)' }} />
              Immutable System Audit Logs ({auditLogs.length})
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  No mutations logged yet. Interacting with the system generates automatic audit records.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl text-xs flex items-center justify-between font-mono"
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: '#818cf8' }}>{log.action}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>on {log.entity_name}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* KYC Verification Sidebar */}
        <div className="space-y-4">
          <div className="lx-panel space-y-4">
            <h2 className="lx-panel-title">
              <Users className="w-4 h-4" style={{ color: 'var(--color-critical-light)' }} />
              Donor KYC &amp; Medical Review Queue
            </h2>

            <div className="space-y-3">
              {donorProfiles.map((dp) => {
                const p = profiles.find((prof) => prof.id === dp.profile_id);
                return (
                  <div
                    key={dp.id}
                    className="p-3.5 rounded-2xl space-y-2"
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{p?.full_name || 'Donor Profile'}</span>
                      <span className="lx-badge lx-badge-critical text-[10px] font-black">
                        {dp.blood_group}
                      </span>
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      Weight: {dp.weight_kg}kg • Status:{' '}
                      <strong style={{ color: 'var(--color-text-secondary)' }}>{dp.verification_status}</strong>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleVerifyDonor(dp.id, true)}
                        className="flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        style={{
                          background: 'var(--color-success-muted)',
                          color: 'var(--color-success-light)',
                          border: '1px solid var(--color-success-border)',
                        }}
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleVerifyDonor(dp.id, false)}
                        className="flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        style={{
                          background: 'var(--color-critical-muted)',
                          color: 'var(--color-critical-light)',
                          border: '1px solid var(--color-critical-border)',
                        }}
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
