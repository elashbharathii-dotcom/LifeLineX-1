import { dbAdapter, checkBloodCompatibility, calculateDistanceKm } from './databaseAdapter';
import { BloodGroupType } from '../types/database';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    toolCalled?: string;
    suggestions?: string[];
  };
}

class AIService {
  public async processQuery(query: string, userLocation?: { lat: number; lon: number }): Promise<AIChatMessage> {
    const q = query.toLowerCase();

    // 1. Guardrail against medical diagnosis or prescription
    if (
      q.includes('diagnos') ||
      q.includes('prescribe') ||
      q.includes('medicine for') ||
      q.includes('what drug') ||
      q.includes('cure my')
    ) {
      return {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content:
          '⚠️ **Medical Guardrail Notice**: Lifeline AI is an emergency coordination assistant and does not provide clinical diagnoses, prescriptions, or medical treatment advice. If you or someone near you is experiencing an acute medical emergency, please trigger the **Emergency SOS** button immediately or proceed to the nearest trauma hospital emergency ward.',
        timestamp: new Date().toISOString(),
        metadata: {
          suggestions: ['Trigger Emergency SOS', 'Find Nearest Emergency Hospital', 'Check Blood Compatibility'],
        },
      };
    }

    // 2. Blood compatibility query
    const bloodMatch = query.match(/\b(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-)\b/gi);
    if (bloodMatch && (q.includes('compatible') || q.includes('donate') || q.includes('receive') || q.includes('can i give'))) {
      const bg1 = bloodMatch[0].toUpperCase() as BloodGroupType;
      const bg2 = (bloodMatch[1]?.toUpperCase() || bg1) as BloodGroupType;

      const canDonate = checkBloodCompatibility(bg1, bg2, 'WHOLE_BLOOD');
      return {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `🩸 **Blood Transfusion Compatibility Check (Scientific Matrix)**:\n\n- **Donor Blood Group**: ${bg1}\n- **Recipient Blood Group**: ${bg2}\n- **Red Blood Cell Compatibility**: ${
          canDonate ? '✅ COMPATIBLE' : '❌ NOT COMPATIBLE'
        }\n\n*Note: All clinical transfusions require final cross-matching and verification by an authorized hospital blood transfusion officer.*`,
        timestamp: new Date().toISOString(),
        metadata: {
          toolCalled: 'checkBloodCompatibility',
          suggestions: ['View Blood Bank Inventory', 'Search Verified Donors', 'Book Donation Slot'],
        },
      };
    }

    // 3. Nearest Emergency Hospital query
    if (q.includes('hospital') || q.includes('emergency room') || q.includes('trauma')) {
      const hospitals = dbAdapter.getTable('hospitals').filter((h) => h.is_active);
      const lat = userLocation?.lat || 13.0827;
      const lon = userLocation?.lon || 80.2707;

      const sorted = [...hospitals].sort(
        (a, b) =>
          calculateDistanceKm(lat, lon, a.latitude, a.longitude) -
          calculateDistanceKm(lat, lon, b.latitude, b.longitude)
      );

      const top = sorted[0];
      const dist = top ? calculateDistanceKm(lat, lon, top.latitude, top.longitude) : 0;

      return {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `🏥 **Nearest Verified Emergency Center**:\n\n- **Facility**: ${top.name}\n- **Distance**: ~${dist.toFixed(
          1
        )} km\n- **Address**: ${top.address}\n- **Emergency Hotline**: ${top.emergency_phone || top.phone}\n- **ICU Beds Available**: ${
          top.icu_beds_available
        } / ${top.total_icu_beds}\n- **Blood Bank On-Site**: ${top.has_blood_bank ? 'Yes' : 'No'}`,
        timestamp: new Date().toISOString(),
        metadata: {
          toolCalled: 'findNearestHospitals',
          suggestions: ['View on Hospital Map', 'Request Ambulance to this Hospital', 'Check Blood Supply'],
        },
      };
    }

    // 4. Blood Inventory / Stock Query
    if (q.includes('inventory') || q.includes('units') || q.includes('stock') || q.includes('plasma')) {
      const inv = dbAdapter.getTable('blood_inventory');
      const oPos = inv.find((i) => i.blood_group === 'O+' && i.component === 'WHOLE_BLOOD');
      const oNeg = inv.find((i) => i.blood_group === 'O-' && i.component === 'WHOLE_BLOOD');
      const aPos = inv.find((i) => i.blood_group === 'A+' && i.component === 'WHOLE_BLOOD');
      const bPos = inv.find((i) => i.blood_group === 'B+' && i.component === 'WHOLE_BLOOD');

      return {
        id: crypto.randomUUID(),
        sender: 'assistant',
        content: `🩸 **Real-Time Blood Bank Inventory Snapshot** (Regional Hub):\n\n- **O+ (Positive)**: ${oPos?.units_available || 0} Units available (${oPos?.units_reserved || 0} reserved)\n- **O- (Universal Donor)**: ${oNeg?.units_available || 0} Units available (⚠️ Critical low stock alert)\n- **A+ (Positive)**: ${aPos?.units_available || 0} Units available\n- **B+ (Positive)**: ${bPos?.units_available || 0} Units available\n\nAll units are pre-tested and stored at monitored 4.0°C cold chain.`,
        timestamp: new Date().toISOString(),
        metadata: {
          toolCalled: 'getBloodInventory',
          suggestions: ['Request Blood Units', 'Initiate Donor Chain', 'Schedule Donation'],
        },
      };
    }

    // 5. General coordination response
    return {
      id: crypto.randomUUID(),
      sender: 'assistant',
      content: `👋 **LifelineX Emergency Coordination Assistant**\n\nI can assist you with:\n1. 🚨 **Emergency SOS & Triage**: Coordinate immediate ambulance & hospital response\n2. 🩸 **Blood & Donor Chain**: Match verified blood donors and check live inventory\n3. 🏥 **Hospital Network**: Check live ICU capacity and trauma centers\n4. 🚑 **Ambulance Telemetry**: Track live GPS and dispatch times\n5. 📅 **Appointments**: Schedule doctor visits or blood donation slots\n\nHow can I help coordinate your healthcare emergency today?`,
      timestamp: new Date().toISOString(),
      metadata: {
        suggestions: ['Trigger Emergency SOS', 'Find Blood Units', 'Locate Nearest Hospital', 'Check Donor Availability'],
      },
    };
  }
}

export const aiService = new AIService();
