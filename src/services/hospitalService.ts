import { dbAdapter } from './databaseAdapter';
import { Hospital, Doctor } from '../types/database';

class HospitalService {
  public getAllHospitals(): Hospital[] {
    return dbAdapter.getTable('hospitals');
  }

  public getHospitalById(id: string): Hospital | undefined {
    return dbAdapter.getTable('hospitals').find((h) => h.id === id);
  }

  public updateCapacity(
    hospitalId: string,
    totalBeds: number,
    icuAvailable: number,
    totalIcu: number,
    updatedBy?: string
  ): Hospital | null {
    const old = dbAdapter.getTable('hospitals').find((h) => h.id === hospitalId);
    const updated = dbAdapter.update('hospitals', hospitalId, {
      total_beds: totalBeds,
      icu_beds_available: icuAvailable,
      total_icu_beds: totalIcu,
    });

    dbAdapter.logAudit(updatedBy, 'HOSPITAL_CAPACITY_UPDATE', 'hospitals', hospitalId, old, updated);
    return updated;
  }

  public getDoctors(hospitalId?: string): Doctor[] {
    const docs = dbAdapter.getTable('doctors');
    if (hospitalId) {
      return docs.filter((d) => d.hospital_id === hospitalId);
    }
    return docs;
  }
}

export const hospitalService = new HospitalService();
