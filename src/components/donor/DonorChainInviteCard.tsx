import React, { useState, useEffect } from 'react';
import { DonorChainMember } from '../../types/database';
import { bloodRequestService } from '../../services/bloodRequestService';
import { dbAdapter } from '../../services/databaseAdapter';
import { Heart, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  member: DonorChainMember;
  onResponded: () => void;
}

export const DonorChainInviteCard: React.FC<Props> = ({ member, onResponded }) => {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600);
  const [isProcessing, setIsProcessing] = useState(false);

  const chain = dbAdapter.getTable('donor_chains').find((c) => c.id === member.donor_chain_id);
  const request = chain
    ? dbAdapter.getTable('blood_requests').find((r) => r.id === chain.blood_request_id)
    : null;
  const hospital = request
    ? dbAdapter.getTable('hospitals').find((h) => h.id === request.hospital_id)
    : null;

  useEffect(() => {
    const expiresAt = new Date(member.expires_at).getTime();
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeftSeconds(diff);
      if (diff === 0 && member.status === 'NOTIFIED') {
        bloodRequestService.respondToDonorChain(member.id, false, 'Timed out');
        onResponded();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [member, onResponded]);

  const handleAccept = () => {
    setIsProcessing(true);
    bloodRequestService.respondToDonorChain(member.id, true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399'],
    });
    setIsProcessing(false);
    onResponded();
  };

  const handleDecline = () => {
    setIsProcessing(true);
    bloodRequestService.respondToDonorChain(member.id, false, 'Donor unavailable at this moment');
    setIsProcessing(false);
    onResponded();
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  return (
    <div className="bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border-2 border-rose-600/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-md">
        Tier {member.tier} Donor Chain
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-500 shrink-0">
          <Heart className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Emergency Blood Donation Request</h3>
          <p className="text-xs text-rose-300">
            {hospital?.name || 'Authorized Emergency Hospital'} requires blood units immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 mb-4">
        <div>
          <span className="text-[10px] text-slate-400 font-medium">Blood Group</span>
          <div className="text-base font-extrabold text-rose-400">{request?.blood_group || 'O+'}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium">Component</span>
          <div className="text-sm font-bold text-slate-200">{request?.component || 'WHOLE_BLOOD'}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium">Units Needed</span>
          <div className="text-sm font-bold text-slate-200">{request?.units_needed || 1} Unit(s)</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-medium">Estimated ETA</span>
          <div className="text-sm font-bold text-emerald-400">~{member.eta_minutes || 20} mins</div>
        </div>
      </div>

      {member.status === 'NOTIFIED' ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-semibold">
            <Clock className="w-4 h-4 animate-spin" />
            <span>
              Response Timeout:{' '}
              <span className="text-sm font-bold">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Decline (Activate Backup)
            </button>
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept & Commit Donation
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* 6-Stage Progress Pipeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Donation Pipeline Progression
              </span>
              <span className="text-emerald-400 font-mono font-bold text-[11px]">
                {member.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
              {[
                { key: 'NOTIFIED', label: '1. Requested' },
                { key: 'ACCEPTED', label: '2. Accepted' },
                { key: 'SCREENING', label: '3. Screening' },
                { key: 'IN_TRANSIT', label: '4. In Transit' },
                { key: 'DONATED', label: '5. Donated' },
                { key: 'COMPLETED', label: '6. Completed' },
              ].map((step, idx) => {
                const currentStatus = member.status;
                const statusOrder = ['NOTIFIED', 'ACCEPTED', 'SCREENING', 'IN_TRANSIT', 'DONATED', 'COMPLETED'];
                const currentStepIdx = statusOrder.indexOf(currentStatus);
                const isCurrent = currentStatus === step.key;
                const isPast = currentStepIdx >= idx;

                return (
                  <div
                    key={step.key}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                        : isPast
                        ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[9px] font-mono uppercase opacity-75">
                      {isPast && !isCurrent ? '✓ DONE' : `STAGE ${idx + 1}`}
                    </div>
                    <div className="mt-0.5 truncate">{step.label.split('. ')[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destination Details (Strict Privacy Safeguards: Hospital Location only, zero patient PII) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Destination Center
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {hospital?.name || 'Apollo Regional Emergency Hospital'}
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {hospital?.address || 'Greams Road, Chennai'} • Blood Transfusion Ward
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((hospital?.name || 'Hospital') + ' ' + (hospital?.address || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                Directions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
