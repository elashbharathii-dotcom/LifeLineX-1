// src/services/pregnancyService.ts

import { dbAdapter } from './databaseAdapter';
import { PregnancyProfile, PregnancyHealthRecord, Guardian } from '../types/database';

/**
 * Service for managing pregnancy related data.
 */
export const pregnancyService = {
  // Pregnancy Profile CRUD
  createProfile: (profile: Omit<PregnancyProfile, 'id' | 'created_at' | 'updated_at'>) => {
    const newProfile = {
      ...profile,
      id: crypto.randomUUID(),
      status: profile.status ?? 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PregnancyProfile;
    return dbAdapter.insert('pregnancy_profiles', newProfile);
  },

  getProfile: (id: string) => {
    const profiles = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    return profiles.find((p) => p.id === id);
  },

  updateProfile: (id: string, updates: Partial<PregnancyProfile>) => {
    return dbAdapter.update('pregnancy_profiles', id, updates);
  },

  listProfilesByPatient: (patientProfileId: string) => {
    const profiles = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    return profiles.filter((p) => p.patient_profile_id === patientProfileId);
  },

  getActiveProfile: (patientProfileId: string): PregnancyProfile | null => {
    const profiles = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    const active = profiles.find((p) => p.patient_profile_id === patientProfileId && p.status === 'ACTIVE');
    if (active) return active;
    const pending = profiles.find((p) => p.patient_profile_id === patientProfileId && p.status === 'PENDING');
    if (pending) return pending;
    return profiles.find((p) => p.patient_profile_id === patientProfileId && p.status !== 'ARCHIVED') || null;
  },

  deactivateProfile: (id: string) => {
    return dbAdapter.update('pregnancy_profiles', id, { status: 'ARCHIVED', updated_at: new Date().toISOString() });
  },

  // Health Records CRUD
  addHealthRecord: (record: Omit<PregnancyHealthRecord, 'id' | 'created_at' | 'updated_at'>) => {
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as PregnancyHealthRecord;
    return dbAdapter.insert('pregnancy_health_records', newRecord);
  },

  getHealthRecords: (profileId: string) => {
    const records = (dbAdapter.getTable('pregnancy_health_records') || []) as PregnancyHealthRecord[];
    return records.filter((r) => r.profile_id === profileId);
  },

  deleteHealthRecord: (recordId: string) => {
    return dbAdapter.delete('pregnancy_health_records', recordId);
  },

  // Guardians CRUD
  addGuardian: (guardian: Omit<Guardian, 'id' | 'created_at' | 'updated_at'>) => {
    const newGuardian = {
      ...guardian,
      id: crypto.randomUUID(),
      verification_status: guardian.verification_status ?? 'PENDING',
      notification_status: guardian.notification_status ?? 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Guardian;
    return dbAdapter.insert('guardians', newGuardian);
  },

  listGuardiansByPatient: (patientProfileId: string) => {
    const guardians = (dbAdapter.getTable('guardians') || []) as Guardian[];
    return guardians.filter((g) => g.patient_profile_id === patientProfileId);
  },

  removeGuardian: (guardianId: string) => {
    return dbAdapter.delete('guardians', guardianId);
  },
};
