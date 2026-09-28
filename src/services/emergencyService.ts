import { dbAdapter, calculateDistanceKm } from './databaseAdapter';
import { notificationService } from './notificationService';
import {
  EmergencySession,
  EmergencyEvent,
  EmergencyStatusType,
  Hospital,
} from '../types/database';

class EmergencyService {
  public async createEmergencySession(
    patientProfileId: string,
    latitude: number,
    longitude: number,
    triageNotes = 'Emergency SOS triggered from mobile client',
    accuracyMeters = 10
  ): Promise<EmergencySession> {
    // Idempotency defense: Prevent duplicate emergencies on rapid clicks or network retries
    const existing = dbAdapter
      .getTable('emergency_sessions')
      .find((s) => s.patient_profile_id === patientProfileId && !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(s.status));
    if (existing) {
      return existing;
    }

    const sessionCode = `EMG-${Date.now().toString().slice(-6)}`;

    // Find nearest verified hospital
    const hospitals = dbAdapter
      .getTable('hospitals')
      .filter((h) => h.is_active && h.verification_status === 'VERIFIED');

    let nearestHospital: Hospital | null = null;
    let minDistance = Infinity;

    hospitals.forEach((h) => {
      const dist = calculateDistanceKm(latitude, longitude, h.latitude, h.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestHospital = h;
      }
    });

    const newSession: EmergencySession = {
      id: crypto.randomUUID(),
      session_code: sessionCode,
      patient_profile_id: patientProfileId,
      emergency_type: 'CRITICAL_TRAUMA_SOS',
      status: 'LOCATION_CONFIRMED',
      latitude,
      longitude,
      location_accuracy_meters: accuracyMeters,
      address_description: `Emergency Coordinates: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`,
      assigned_hospital_id: nearestHospital ? (nearestHospital as Hospital).id : undefined,
      triage_notes: triageNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbAdapter.insert('emergency_sessions', newSession);

    // Record initial event
    this.addEvent(
      newSession.id,
      'EMERGENCY_INITIATED',
      'LOCATION_CONFIRMED',
      'Emergency SOS Broadcasted',
      `Patient triggered SOS. High-accuracy location verified within ${accuracyMeters}m. Nearest trauma center identified: ${
        nearestHospital ? (nearestHospital as Hospital).name : 'Grid searching'
      } (${minDistance.toFixed(1)} km away).`,
      patientProfileId,
      'PATIENT'
    );

    // Notify Hospital Command Center
    const hospitalAdmins = dbAdapter.getTable('profiles').filter((p) => p.email.includes('hospital.admin'));
    hospitalAdmins.forEach((admin) => {
      notificationService.sendNotification(
        admin.id,
        'EMERGENCY',
        `CRITICAL ALERT: Emergency ${sessionCode}`,
        `New incoming trauma patient at approx ${minDistance.toFixed(1)} km away. Immediate triage required.`,
        'URGENT',
        `/command-center`
      );
    });

    dbAdapter.logAudit(patientProfileId, 'EMERGENCY_CREATED', 'emergency_sessions', newSession.id, null, newSession);

    return newSession;
  }

  public addEvent(
    sessionId: string,
    eventType: string,
    statusSnapshot: EmergencyStatusType,
    title: string,
    description: string,
    actorId?: string,
    actorRole?: any
  ): EmergencyEvent {
    const event: EmergencyEvent = {
      id: crypto.randomUUID(),
      emergency_session_id: sessionId,
      event_type: eventType,
      status_snapshot: statusSnapshot,
      actor_id: actorId,
      actor_role: actorRole,
      title,
      description,
      created_at: new Date().toISOString(),
    };

    dbAdapter.insert('emergency_events', event);
    return event;
  }

  public updateStatus(
    sessionId: string,
    newStatus: EmergencyStatusType,
    title: string,
    description: string,
    actorId?: string,
    actorRole?: any
  ): EmergencySession | null {
    const session = dbAdapter.update('emergency_sessions', sessionId, {
      status: newStatus,
      resolved_at: ['COMPLETED', 'CANCELLED'].includes(newStatus) ? new Date().toISOString() : undefined,
    });

    if (session) {
      this.addEvent(sessionId, `STATUS_${newStatus}`, newStatus, title, description, actorId, actorRole);
      dbAdapter.logAudit(actorId, 'EMERGENCY_STATUS_UPDATE', 'emergency_sessions', sessionId, null, { newStatus, title });
    }

    return session;
  }

  public getActiveEmergency(patientProfileId?: string): EmergencySession | null {
    const sessions = dbAdapter.getTable('emergency_sessions');
    const active = sessions.find((s) => {
      const isNotDone = !['COMPLETED', 'CANCELLED'].includes(s.status);
      return patientProfileId ? isNotDone && s.patient_profile_id === patientProfileId : isNotDone;
    });
    return active || null;
  }

  public getAllEmergencies(): EmergencySession[] {
    return dbAdapter.getTable('emergency_sessions');
  }

  public getEventsForSession(sessionId: string): EmergencyEvent[] {
    return dbAdapter
      .getTable('emergency_events')
      .filter((e) => e.emergency_session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
}

export const emergencyService = new EmergencyService();
