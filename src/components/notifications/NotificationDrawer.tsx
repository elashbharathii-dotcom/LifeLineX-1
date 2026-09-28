import React, { useState, useEffect, useMemo } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types/database';
import {
  Bell,
  X,
  Clock,
  ShieldAlert,
  Heart,
  Truck,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

type FilterCategory = 'ALL' | 'EMERGENCY' | 'APPOINTMENTS' | 'BLOOD' | 'AMBULANCE';

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose, onNavigateTab }) => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<FilterCategory>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (profile?.id) {
      return notificationService.getNotificationsForUser(profile.id);
    }
    return [];
  });

  useEffect(() => {
    const refresh = () => {
      if (profile?.id) {
        setNotifications(notificationService.getNotificationsForUser(profile.id));
      }
    };
    const unsub = dbAdapter.subscribe('notifications', refresh);
    return () => unsub();
  }, [profile?.id]);

  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'EMERGENCY') return n.type === 'EMERGENCY';
      if (filter === 'APPOINTMENTS') return n.type === 'APPOINTMENT';
      if (filter === 'BLOOD') return n.type === 'BLOOD_REQUEST' || n.type === 'DONOR_CHAIN';
      if (filter === 'AMBULANCE') return n.type === 'AMBULANCE';
      return true;
    });
  }, [notifications, filter]);

  if (!isOpen) return null;

  const handleMarkAll = () => {
    if (profile?.id) {
      notificationService.markAllAsRead(profile.id);
      setNotifications(notificationService.getNotificationsForUser(profile.id));
    }
  };

  const handleItemClick = (n: Notification) => {
    notificationService.markAsRead(n.id);
    if (profile?.id) {
      setNotifications(notificationService.getNotificationsForUser(profile.id));
    }
    if (n.action_url) {
      const tab = n.action_url.replace('/', '');
      onNavigateTab(tab || 'emergency');
      onClose();
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'DONOR_CHAIN':
      case 'BLOOD_REQUEST':
        return <Heart className="w-5 h-5 text-rose-600" />;
      case 'AMBULANCE':
        return <Truck className="w-5 h-5 text-amber-600" />;
      case 'APPOINTMENT':
        return <Calendar className="w-5 h-5 text-[var(--color-primary)]" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[var(--color-border-default)] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-default)] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[var(--color-primary)] flex items-center justify-center border border-teal-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--color-text-primary)]">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">Emergency broadcasts &amp; updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                title="Mark all as read"
                className="lx-btn lx-btn-secondary lx-btn-sm"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="p-3 bg-[#F7F8F6] border-b border-[var(--color-border-default)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'EMERGENCY', 'APPOINTMENTS', 'BLOOD', 'AMBULANCE'] as FilterCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filter === cat
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-default)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-20 text-[var(--color-text-muted)] space-y-3">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-slate-100 text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold">No notifications recorded</p>
              <p className="text-[11px] max-w-xs mx-auto text-[var(--color-text-muted)]">
                You will receive alerts here when emergency coordinates, appointments, or blood drives update.
              </p>
            </div>
          ) : (
            filteredList.map((n) => {
              const isUnread = n.status !== 'READ';
              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${
                    isUnread
                      ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200/50'
                      : 'bg-white border-[var(--color-border-default)] hover:bg-[#F7F8F6]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-border-default)] flex items-center justify-center shrink-0 shadow-xs">
                      {getNotifIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-[var(--color-text-primary)] truncate">{n.title}</span>
                        {n.priority === 'URGENT' || n.priority === 'HIGH' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider shrink-0">
                            {n.priority}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{n.body}</p>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-2 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
