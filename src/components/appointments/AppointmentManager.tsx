import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { Appointment, Doctor, Hospital, BloodBank } from '../../types/database';
import {
  Calendar,
  Clock,
  User,
  Heart,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Stethoscope,
  Building,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AppointmentManager: React.FC = () => {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>(() => appointmentService.getAppointments());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => dbAdapter.getTable('hospitals'));
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>(() => dbAdapter.getTable('blood_banks'));
  const [doctors, setDoctors] = useState<Doctor[]>(() => dbAdapter.getTable('doctors'));

  // Active Tab: UPCOMING | PAST | CANCELLED
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAppointmentForDetail, setSelectedAppointmentForDetail] = useState<Appointment | null>(null);

  // Booking Form State
  const [bookingType, setBookingType] = useState<'DOCTOR_CONSULTATION' | 'BLOOD_DONATION'>('DOCTOR_CONSULTATION');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(() => {
    const hs = dbAdapter.getTable('hospitals');
    return hs[0]?.id || '';
  });
  const [selectedBloodBankId, setSelectedBloodBankId] = useState<string>(() => {
    const bbs = dbAdapter.getTable('blood_banks');
    return bbs[0]?.id || '';
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    const docs = dbAdapter.getTable('doctors');
    return docs[0]?.id || '';
  });
  const [appointmentDate, setAppointmentDate] = useState('2026-09-30');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setHospitals(dbAdapter.getTable('hospitals'));
    setBloodBanks(dbAdapter.getTable('blood_banks'));
    setDoctors(dbAdapter.getTable('doctors'));
    setAppointments(appointmentService.getAppointments());
  }, []);

  useEffect(() => {
    const unsub = dbAdapter.subscribe('appointments', refreshData);
    return () => unsub();
  }, [refreshData]);

  // Filtered appointments by category
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (activeTab === 'CANCELLED') {
        return apt.status === 'CANCELLED';
      }
      if (activeTab === 'PAST') {
        return apt.status === 'COMPLETED';
      }
      // UPCOMING includes CONFIRMED, SCHEDULED, IN_PROGRESS
      return apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
    });
  }, [appointments, activeTab]);

  // Next upcoming appointment for Hero highlight
  const nextAppointment = useMemo(() => {
    const upcoming = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED');
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [appointments]);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    const pId = profile?.id || '11111111-1111-1111-1111-111111111101';

    let facId = selectedHospitalId;
    let facName = hospitals.find((h) => h.id === selectedHospitalId)?.name || 'Hospital Facility';

    if (bookingType === 'BLOOD_DONATION') {
      facId = selectedBloodBankId;
      facName = bloodBanks.find((b) => b.id === selectedBloodBankId)?.name || 'Blood Donation Center';
    }

    try {
      appointmentService.bookAppointment(
        pId,
        bookingType,
        bookingType === 'DOCTOR_CONSULTATION' ? 'HOSPITAL' : 'BLOOD_BANK',
        facId,
        facName,
        appointmentDate,
        appointmentTime,
        bookingType === 'DOCTOR_CONSULTATION' ? selectedDoctorId : undefined,
        notes
      );

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0f4c47', '#e2f2a4', '#10b981'],
      });

      setNotes('');
      setShowBookingModal(false);
      refreshData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to book appointment.';
      setBookingError(errorMsg);
    }
  };

  const handleCancelAppointment = (id: string) => {
    if (window.confirm('Are you sure you wish to cancel this scheduled appointment?')) {
      appointmentService.updateStatus(id, 'CANCELLED');
      refreshData();
      if (selectedAppointmentForDetail?.id === id) {
        setSelectedAppointmentForDetail(null);
      }
    }
  };

  const handleReschedule = (apt: Appointment) => {
    setBookingType(apt.appointment_type);
    if (apt.facility_type === 'HOSPITAL') {
      setSelectedHospitalId(apt.facility_id);
      if (apt.doctor_id) setSelectedDoctorId(apt.doctor_id);
    } else {
      setSelectedBloodBankId(apt.facility_id);
    }
    setShowBookingModal(true);
    setSelectedAppointmentForDetail(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                Clinical Care &amp; Donations
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                Your appointments
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Manage your hospital visits, expert consultations, prenatal checkups, and voluntary blood donation sessions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="lx-btn lx-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Book an appointment</span>
          </button>
        </div>
      </div>

      {/* ── 2. Next Appointment Hero Summary (if exists) ── */}
      {nextAppointment && (
        <div className="rounded-[28px] p-6 sm:p-8 bg-gradient-to-br from-[#0F4C47] to-[#0A3834] text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
            <CalendarCheck className="w-80 h-80" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)]">
                Next Appointment
              </span>
              <span className="text-xs font-mono text-teal-200">
                Token ID: {nextAppointment.appointment_code}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {nextAppointment.doctor?.name ? nextAppointment.doctor.name : nextAppointment.facility_name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-teal-100">
                  {nextAppointment.doctor?.specialty && (
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-[var(--color-accent-mint)]" />
                      {nextAppointment.doctor.specialty}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[var(--color-accent-mint)]" />
                    {nextAppointment.facility_name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-accent-mint)]" />
                    {nextAppointment.appointment_date}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-semibold backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-[var(--color-accent-mint)]" />
                    {nextAppointment.start_time}
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {nextAppointment.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center lg:items-end">
                <button
                  onClick={() => setSelectedAppointmentForDetail(nextAppointment)}
                  className="lx-btn lx-btn-secondary lx-btn-sm text-center"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleReschedule(nextAppointment)}
                  className="lx-btn lx-btn-outline lx-btn-sm text-center"
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Tabs (Upcoming | Past | Cancelled) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--color-border-default)] pb-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[var(--color-border-default)] shadow-sm">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Upcoming ({appointments.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'PAST'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Past ({appointments.filter((a) => a.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'CANCELLED'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Cancelled ({appointments.filter((a) => a.status === 'CANCELLED').length})
          </button>
        </div>

        <div className="text-xs font-medium text-[var(--color-text-muted)]">
          Total recorded appointments: <strong className="text-[var(--color-text-primary)]">{appointments.length}</strong>
        </div>
      </div>

      {/* ── 4. Appointment Cards List or Empty State ── */}
      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--color-text-primary)]">
              {activeTab === 'UPCOMING' ? 'No upcoming appointments' : `No ${activeTab.toLowerCase()} appointments found`}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
              {activeTab === 'UPCOMING'
                ? 'Your upcoming appointments will appear here. Choose from top hospital departments or schedule voluntary blood donation.'
                : `There are currently no records for ${activeTab.toLowerCase()} appointments.`}
            </p>
          </div>
          {activeTab === 'UPCOMING' && (
            <div className="pt-2">
              <button
                onClick={() => setShowBookingModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md transition-all hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                Book an appointment
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                      apt.appointment_type === 'BLOOD_DONATION'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-teal-50 text-[var(--color-primary)] border border-teal-100'
                    }`}
                  >
                    {apt.appointment_type === 'BLOOD_DONATION' ? (
                      <Heart className="w-5 h-5" />
                    ) : (
                      <Stethoscope className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      apt.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : apt.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-[var(--color-text-primary)]">
                  {apt.doctor?.name ? apt.doctor.name : apt.facility_name}
                </h3>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mt-0.5">
                  {apt.doctor?.specialty ? apt.doctor.specialty : (apt.appointment_type === 'BLOOD_DONATION' ? 'Blood Donation Hub' : 'General Care')}
                </p>

                <div className="mt-4 pt-4 border-t border-[var(--color-border-muted)] space-y-2 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    <span className="truncate">{apt.facility_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    <span>{apt.appointment_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                    <span>{apt.start_time}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-[var(--color-border-muted)] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedAppointmentForDetail(apt)}
                  className="lx-btn lx-btn-secondary lx-btn-sm"
                >
                  View
                </button>
                {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReschedule(apt)}
                      className="lx-btn lx-btn-outline lx-btn-sm"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelAppointment(apt.id)}
                      className="lx-btn lx-btn-danger lx-btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. Appointment Detail Modal ── */}
      {selectedAppointmentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)]">
            <button
              onClick={() => setSelectedAppointmentForDetail(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  {selectedAppointmentForDetail.appointment_code}
                </span>
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                  Appointment Details
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Facility</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{selectedAppointmentForDetail.facility_name}</span>
                </div>
                {selectedAppointmentForDetail.doctor && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Physician</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {selectedAppointmentForDetail.doctor.name} ({selectedAppointmentForDetail.doctor.specialty})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Scheduled Date</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{selectedAppointmentForDetail.appointment_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Scheduled Time</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{selectedAppointmentForDetail.start_time}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-muted)]">
                  <span className="text-[var(--color-text-muted)]">Status</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedAppointmentForDetail.status}
                  </span>
                </div>
              </div>

              {selectedAppointmentForDetail.notes && (
                <div className="p-3.5 rounded-2xl bg-white border border-[var(--color-border-default)]">
                  <span className="font-bold text-[var(--color-text-secondary)] block mb-1">Notes / Instructions:</span>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">{selectedAppointmentForDetail.notes}</p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Please arrive 10 minutes prior to your designated consultation slot. Present your token code at the facility reception desk.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedAppointmentForDetail(null)}
                className="px-5 py-2.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
              {selectedAppointmentForDetail.status !== 'CANCELLED' && selectedAppointmentForDetail.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleCancelAppointment(selectedAppointmentForDetail.id)}
                  className="px-5 py-2.5 rounded-full font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Booking Modal ── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                  Book an Appointment
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Reserve a consultation or schedule voluntary blood donation.
                </p>
              </div>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F8F6] rounded-2xl border border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setBookingType('DOCTOR_CONSULTATION')}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    bookingType === 'DOCTOR_CONSULTATION'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Doctor Consult
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('BLOOD_DONATION')}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    bookingType === 'BLOOD_DONATION'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" /> Blood Donation
                </button>
              </div>

              {bookingType === 'DOCTOR_CONSULTATION' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                      Select Healthcare Facility
                    </label>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                    >
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.address || 'Chennai'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                      Select Medical Specialist
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Select Blood Bank / Donation Hub
                  </label>
                  <select
                    value={selectedBloodBankId}
                    onChange={(e) => setSelectedBloodBankId(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  >
                    {bloodBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.address || 'Chennai'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Time Slot
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  >
                    {['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Reason for Visit / Symptoms (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your health concern, symptoms, or prenatal note..."
                  rows={3}
                  className="w-full bg-white border border-[var(--color-border-default)] rounded-2xl p-3.5 text-xs text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="lx-btn lx-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lx-btn lx-btn-primary flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
