import React from 'react';
import { EmergencyEvent } from '../../types/database';
import { Clock, Activity } from 'lucide-react';

interface Props {
  events: EmergencyEvent[];
}

export const EmergencyTimeline: React.FC<Props> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-caption">
        No events recorded for this emergency session yet.
      </div>
    );
  }

  return (
    <div
      className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5"
      style={{
        // @ts-ignore
        '--tw-before-bg': 'var(--color-border-subtle)',
      }}
    >
      <div
        className="absolute inset-0 left-3.5 w-0.5 pointer-events-none"
        style={{ background: 'var(--color-border-subtle)' }}
      />
      {events.map((ev, index) => {
        const date = new Date(ev.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const isLatest = index === events.length - 1;

        return (
          <div key={ev.id} className="relative flex items-start gap-3 pl-1 group">
            {/* Timeline Dot */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                isLatest
                  ? 'animate-pulse'
                  : ''
              }`}
              style={
                isLatest
                  ? {
                      background: 'var(--color-critical)',
                      color: 'white',
                      boxShadow: '0 0 0 4px var(--color-critical-muted)',
                    }
                  : {
                      background: 'var(--color-bg-subtle)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border-default)',
                    }
              }
            >
              {isLatest ? <Activity className="w-3.5 h-3.5" /> : index + 1}
            </div>

            {/* Event Body */}
            <div
              className="flex-1 rounded-xl p-3 transition-colors"
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</span>
                <span className="text-[11px] flex items-center gap-1 font-mono" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock className="w-3 h-3" />
                  {timeStr}
                </span>
              </div>
              {ev.description && <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{ev.description}</p>}
              <div className="mt-2 flex items-center gap-2">
                <span className="lx-badge lx-badge-neutral text-[10px]">
                  {ev.status_snapshot.replace('_', ' ')}
                </span>
                {ev.actor_role && (
                  <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Actor: {ev.actor_role}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
