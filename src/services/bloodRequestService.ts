import { dbAdapter, calculateDistanceKm, checkBloodCompatibility } from './databaseAdapter';
import { notificationService } from './notificationService';
import {
  BloodRequest,
  DonorChain,
  DonorChainMember,
  BloodGroupType,
  BloodComponentType,
  DonorProfile,
} from '../types/database';

export interface DonorCandidate {
  donorProfile: DonorProfile;
  distanceKm: number;
  isExactGroup: boolean;
  score: number;
}

class BloodRequestService {
  public createBloodRequest(
    hospitalId: string,
    requestedBy: string,
    bloodGroup: BloodGroupType,
    component: BloodComponentType,
    unitsNeeded: number,
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE',
    clinicalNotes: string,
    patientName = 'Emergency Patient',
    requiredHoursAhead = 4
  ): BloodRequest {
    const requestCode = `BLD-${Date.now().toString().slice(-6)}`;
    const requiredBy = new Date(Date.now() + requiredHoursAhead * 3600 * 1000).toISOString();

    const hospital = dbAdapter.getTable('hospitals').find((h) => h.id === hospitalId);

    const newRequest: BloodRequest = {
      id: crypto.randomUUID(),
      request_code: requestCode,
      hospital_id: hospitalId,
      requested_by: requestedBy,
      patient_name: patientName,
      blood_group: bloodGroup,
      component,
      units_needed: unitsNeeded,
      units_fulfilled: 0,
      urgency,
      status: 'SEARCHING',
      required_by_time: requiredBy,
      latitude: hospital?.latitude,
      longitude: hospital?.longitude,
      clinical_notes: clinicalNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbAdapter.insert('blood_requests', newRequest);
    dbAdapter.logAudit(requestedBy, 'BLOOD_REQUEST_CREATED', 'blood_requests', newRequest.id, null, newRequest);

    // Automatically trigger Smart Donor Matching & initiate Donor Chain
    this.initiateDonorChain(newRequest.id);

    return newRequest;
  }

  public findPotentialDonors(
    bloodGroup: BloodGroupType,
    component: BloodComponentType,
    hospitalLat?: number,
    hospitalLon?: number,
    maxDistanceKm = 30
  ): DonorCandidate[] {
    const donorProfiles = dbAdapter.getTable('donor_profiles');
    const profiles = dbAdapter.getTable('profiles');

    const candidates: DonorCandidate[] = [];

    donorProfiles.forEach((dp) => {
      if (dp.availability_status !== 'AVAILABLE' || dp.verification_status !== 'VERIFIED') {
        return;
      }

      const isCompatible = checkBloodCompatibility(dp.blood_group, bloodGroup, component);
      if (!isCompatible) return;

      const profile = profiles.find((p) => p.id === dp.profile_id);
      let dist = 5.0; // default proximate if coords missing
      if (hospitalLat && hospitalLon && profile?.latitude && profile?.longitude) {
        dist = calculateDistanceKm(hospitalLat, hospitalLon, profile.latitude, profile.longitude);
      }

      if (dist <= maxDistanceKm) {
        const isExact = dp.blood_group === bloodGroup;
        const score = (isExact ? 100 : 70) - dist * 1.5 + dp.total_donations_count * 2;
        candidates.push({
          donorProfile: { ...dp, profile },
          distanceKm: dist,
          isExactGroup: isExact,
          score,
        });
      }
    });

    return candidates.sort((a, b) => b.score - a.score);
  }

  public initiateDonorChain(bloodRequestId: string, batchSize = 3, timeoutMinutes = 15): DonorChain | null {
    const request = dbAdapter.getTable('blood_requests').find((r) => r.id === bloodRequestId);
    if (!request) return null;

    const candidates = this.findPotentialDonors(
      request.blood_group,
      request.component,
      request.latitude,
      request.longitude
    );

    const chain: DonorChain = {
      id: crypto.randomUUID(),
      blood_request_id: bloodRequestId,
      status: 'DISPATCHING',
      current_tier: 1,
      batch_size: batchSize,
      response_timeout_minutes: timeoutMinutes,
      auto_escalate: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbAdapter.insert('donor_chains', chain);

    // Notify Batch 1 (Tier 1)
    const tier1Candidates = candidates.slice(0, batchSize);
    tier1Candidates.forEach((cand) => {
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();
      const member: DonorChainMember = {
        id: crypto.randomUUID(),
        donor_chain_id: chain.id,
        donor_profile_id: cand.donorProfile.id,
        tier: 1,
        notified_at: new Date().toISOString(),
        status: 'NOTIFIED',
        expires_at: expiresAt,
        eta_minutes: Math.round(cand.distanceKm * 4 + 10),
        created_at: new Date().toISOString(),
      };
      dbAdapter.insert('donor_chain_members', member);

      // Send High-Priority Notification to Donor
      notificationService.sendNotification(
        cand.donorProfile.profile_id,
        'DONOR_CHAIN',
        `URGENT: ${request.blood_group} Blood Needed in Donor Chain!`,
        `Hospital urgently requires ${request.units_needed} units of ${request.blood_group} ${request.component}. You are in Tier 1 batch. Please respond within ${timeoutMinutes} minutes.`,
        'URGENT',
        `/donor-chain`
      );
    });

    // Update request state
    dbAdapter.update('blood_requests', bloodRequestId, { status: 'MATCHING' });

    return chain;
  }

  public respondToDonorChain(
    memberId: string,
    accepted: boolean,
    rejectionReason?: string
  ): DonorChainMember | null {
    const member = dbAdapter.getTable('donor_chain_members').find((m) => m.id === memberId);
    if (!member) return null;

    const updated = dbAdapter.update('donor_chain_members', memberId, {
      status: accepted ? 'ACCEPTED' : 'DECLINED',
      responded_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    });

    if (accepted) {
      // Transition Chain to SECURED
      dbAdapter.update('donor_chains', member.donor_chain_id, {
        status: 'SECURED',
      });

      const chain = dbAdapter.getTable('donor_chains').find((c) => c.id === member.donor_chain_id);
      if (chain) {
        dbAdapter.update('blood_requests', chain.blood_request_id, {
          status: 'SECURED',
          units_fulfilled: 1,
        });

        // Notify Hospital
        const req = dbAdapter.getTable('blood_requests').find((r) => r.id === chain.blood_request_id);
        if (req) {
          notificationService.sendNotification(
            req.requested_by,
            'BLOOD_REQUEST',
            `Donor Chain Match Accepted: ${req.request_code}`,
            `A verified donor has accepted the donation request and is en route with ETA ${member.eta_minutes || 25} mins.`,
            'HIGH',
            `/command-center`
          );
        }
      }
    } else {
      // If declined, automatically activate backup donor from candidate pool if available
      this.escalateToNextTier(member.donor_chain_id);
    }

    return updated;
  }

  public confirmFacilityDonation(memberId: string): boolean {
    const member = dbAdapter.getTable('donor_chain_members').find((m) => m.id === memberId);
    if (!member) return false;

    dbAdapter.update('donor_chain_members', memberId, {
      status: 'CONFIRMED_BY_FACILITY',
      confirmed_by_facility_at: new Date().toISOString(),
    });

    const chain = dbAdapter.getTable('donor_chains').find((c) => c.id === member.donor_chain_id);
    if (chain) {
      dbAdapter.update('blood_requests', chain.blood_request_id, {
        status: 'FACILITY_CONFIRMED',
      });
    }

    return true;
  }

  private escalateToNextTier(donorChainId: string) {
    const chain = dbAdapter.getTable('donor_chains').find((c) => c.id === donorChainId);
    if (!chain) return;

    const request = dbAdapter.getTable('blood_requests').find((r) => r.id === chain.blood_request_id);
    if (!request) return;

    const existingMembers = dbAdapter
      .getTable('donor_chain_members')
      .filter((m) => m.donor_chain_id === donorChainId);

    const existingIds = new Set(existingMembers.map((m) => m.donor_profile_id));
    const allCandidates = this.findPotentialDonors(request.blood_group, request.component);
    const backup = allCandidates.find((c) => !existingIds.has(c.donorProfile.id));

    if (backup) {
      const nextTier = (chain.current_tier || 1) + 1;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const member: DonorChainMember = {
        id: crypto.randomUUID(),
        donor_chain_id: chain.id,
        donor_profile_id: backup.donorProfile.id,
        tier: nextTier,
        notified_at: new Date().toISOString(),
        status: 'NOTIFIED',
        expires_at: expiresAt,
        eta_minutes: Math.round(backup.distanceKm * 4 + 10),
        created_at: new Date().toISOString(),
      };
      dbAdapter.insert('donor_chain_members', member);
      dbAdapter.update('donor_chains', chain.id, { current_tier: nextTier });

      notificationService.sendNotification(
        backup.donorProfile.profile_id,
        'DONOR_CHAIN',
        `BACKUP ACTIVATION: ${request.blood_group} Blood Needed!`,
        `You have been activated in Tier ${nextTier} backup pool for emergency request ${request.request_code}.`,
        'URGENT',
        `/donor-chain`
      );
    }
  }

  public getAllBloodRequests(): BloodRequest[] {
    return dbAdapter.getTable('blood_requests');
  }

  public getActiveChains(): DonorChain[] {
    return dbAdapter.getTable('donor_chains');
  }

  public getChainMembers(chainId: string): DonorChainMember[] {
    return dbAdapter.getTable('donor_chain_members').filter((m) => m.donor_chain_id === chainId);
  }
}

export const bloodRequestService = new BloodRequestService();
