import { dbAdapter } from './databaseAdapter';
import { notificationService } from './notificationService';
import { Appointment, AppointmentStatusType } from '../types/database';

class AppointmentService {
  public bookAppointment(
    patientProfileId: string,
    appointmentType: 'DOCTOR_CONSULTATION' | 'BLOOD_DONATION',
    facilityType: 'HOSPITAL' | 'BLOOD_BANK',
    facilityId: string,
    facilityName: string,
    appointmentDate: string,
    startTime: string,
    doctorId?: string,
    notes?: string
  ): Appointment {
    const appointmentCode = `APT-${Date.now().toString().slice(-6)}`;
    const slotId = `slot-${facilityId}-${doctorId || 'donation'}-${appointmentDate}-${startTime}`;

    // Slot collision check: Prevent double booking of the same confirmed slot
    const existingSlot = (dbAdapter.getTable('appointments') || []).find(
      (a) => a.slot_id === slotId && a.status === 'CONFIRMED'
    );
    if (existingSlot) {
      throw new Error('This time slot is already booked. Please choose another time.');
    }

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      appointment_code: appointmentCode,
      appointment_type: appointmentType,
      patient_profile_id: patientProfileId,
      facility_type: facilityType,
      facility_id: facilityId,
      facility_name: facilityName,
      doctor_id: doctorId,
      slot_id: slotId,
      appointment_date: appointmentDate,
      start_time: startTime,
      status: 'CONFIRMED',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbAdapter.insert('appointments', newAppointment);

    // Send confirmation notification
    notificationService.sendNotification(
      patientProfileId,
      'APPOINTMENT',
      `Appointment Confirmed (${appointmentCode})`,
      `Your ${appointmentType === 'BLOOD_DONATION' ? 'Blood Donation Slot' : 'Doctor Consultation'} at ${facilityName} is confirmed for ${appointmentDate} at ${startTime}.`,
      'NORMAL',
      `/appointments`
    );

    dbAdapter.logAudit(patientProfileId, 'APPOINTMENT_BOOKED', 'appointments', newAppointment.id, null, newAppointment);
    return newAppointment;
  }

  public updateStatus(appointmentId: string, status: AppointmentStatusType): Appointment | null {
    return dbAdapter.update('appointments', appointmentId, { status });
  }

  public getAppointments(patientProfileId?: string): Appointment[] {
    const apts = (dbAdapter.getTable('appointments') || []) as Appointment[];
    const doctors = (dbAdapter.getTable('doctors') || []);
    const enriched = apts.map((a) => ({
      ...a,
      doctor: doctors.find((d) => d?.id === a?.doctor_id),
    }));

    if (patientProfileId) {
      return enriched.filter((a) => a?.patient_profile_id === patientProfileId);
    }
    return enriched;
  }
}

export const appointmentService = new AppointmentService();
