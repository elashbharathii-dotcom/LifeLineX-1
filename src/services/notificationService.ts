import { dbAdapter } from './databaseAdapter';
import { Notification, NotificationTypeEnum } from '../types/database';

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    // Sound enabled check
    try {
      const stored = localStorage.getItem('lifelinex_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    } catch (e) {
      console.warn(e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('lifelinex_sound_enabled', String(enabled));
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private playTone(frequency = 880, type: OscillatorType = 'sine', duration = 0.25) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      }
    } catch (e) {
      console.warn('Audio tone could not play', e);
    }
  }

  public playEmergencyChime() {
    this.playTone(920, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(1200, 'triangle', 0.5), 180);
  }

  public playNotificationChime() {
    this.playTone(659.25, 'sine', 0.15);
    setTimeout(() => this.playTone(880, 'sine', 0.25), 100);
  }

  public sendNotification(
    recipientId: string,
    type: NotificationTypeEnum,
    title: string,
    body: string,
    priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL',
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Notification {
    const notif: Notification = {
      id: crypto.randomUUID(),
      recipient_id: recipientId,
      type,
      title,
      body,
      status: 'DELIVERED',
      priority,
      action_url: actionUrl,
      metadata,
      created_at: new Date().toISOString(),
    };

    dbAdapter.insert('notifications', notif);

    if (priority === 'URGENT' || type === 'EMERGENCY') {
      this.playEmergencyChime();
    } else {
      this.playNotificationChime();
    }

    return notif;
  }

  public getNotificationsForUser(userId: string): Notification[] {
    return (dbAdapter.getTable('notifications') || [])
      .filter((n) => n?.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markAsRead(notificationId: string) {
    dbAdapter.update('notifications', notificationId, {
      status: 'READ',
      read_at: new Date().toISOString(),
    });
  }

  public markAllAsRead(userId: string) {
    const notifs = (dbAdapter.getTable('notifications') || []).filter((n) => n?.recipient_id === userId);
    notifs.forEach((n) => {
      dbAdapter.update('notifications', n.id, {
        status: 'READ',
        read_at: new Date().toISOString(),
      });
    });
  }
}

export const notificationService = new NotificationService();
