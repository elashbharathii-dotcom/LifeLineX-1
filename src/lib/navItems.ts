import { UserRoleType } from '../types/database';

export interface NavItem {
  id: string;
  label: string;
  section?: string;
  iconName: string;
  isCritical?: boolean;
}

export function getRoleNavItems(role: UserRoleType, hasActiveEmergency = false): NavItem[] {
  switch (role) {
    case 'PATIENT':
      return [
        { id: 'home', label: 'Home', iconName: 'Home', section: 'MAIN' },
        { id: 'emergency', label: hasActiveEmergency ? 'Active Emergency' : 'Emergency Help', iconName: 'Activity', isCritical: true, section: 'MAIN' },
        { id: 'appointments', label: 'Appointments', iconName: 'Calendar', section: 'MAIN' },
        { id: 'map', label: 'Healthcare Map', iconName: 'Map', section: 'MAIN' },
        { id: 'profile', label: 'Profile', iconName: 'User', section: 'HEALTH' },
        { id: 'donor', label: 'Donor Mode', iconName: 'Heart', section: 'HEALTH' },
        { id: 'pregnancy', label: 'Pregnancy Care', iconName: 'Baby', section: 'HEALTH' },
        { id: 'discovery', label: 'Care Directory', iconName: 'Compass', section: 'HEALTH' },
        { id: 'ai', label: 'Ask Lifeline', iconName: 'Sparkles', section: 'SUPPORT' },
      ];

    case 'DONOR':
      return [
        { id: 'donor', label: 'Donor Command', iconName: 'Heart' },
        { id: 'appointments', label: 'Donation Schedule', iconName: 'Calendar' },
        { id: 'map', label: 'Donation Centers', iconName: 'Map' },
        { id: 'bloodbank', label: 'Blood Banks', iconName: 'Droplet' },
        { id: 'emergency', label: 'Urgent Needs', iconName: 'Activity', isCritical: hasActiveEmergency },
        { id: 'ai', label: 'Lifeline AI', iconName: 'Sparkles' },
      ];

    case 'HOSPITAL_ADMIN':
    case 'HOSPITAL_STAFF':
      return [
        { id: 'hospital', label: 'Command Center', iconName: 'Building' },
        { id: 'emergency', label: 'ER Triage Queue', iconName: 'Activity', isCritical: true },
        { id: 'pregnancy', label: 'Pregnancy Care', iconName: 'Baby' },
        { id: 'bloodbank', label: 'Blood Requisitions', iconName: 'Droplet' },
        { id: 'ambulance', label: 'Ambulance Grid', iconName: 'Truck' },
        { id: 'appointments', label: 'Clinical Schedule', iconName: 'Calendar' },
        { id: 'map', label: 'Facility Map', iconName: 'Map' },
        { id: 'donor', label: 'Donor Pool', iconName: 'Heart' },
        { id: 'ai', label: 'Clinical Assistant', iconName: 'Sparkles' },
      ];

    case 'BLOOD_BANK_ADMIN':
    case 'BLOOD_BANK_STAFF':
      return [
        { id: 'bloodbank', label: 'Inventory Command', iconName: 'Droplet' },
        { id: 'emergency', label: 'Critical SOS Calls', iconName: 'Activity', isCritical: true },
        { id: 'donor', label: 'Donor Roster & Chains', iconName: 'Heart' },
        { id: 'appointments', label: 'Collection Camps', iconName: 'Calendar' },
        { id: 'map', label: 'Cold-Chain Map', iconName: 'Map' },
        { id: 'discovery', label: 'Hospital Allocations', iconName: 'Building' },
      ];

    case 'AMBULANCE_DRIVER':
      return [
        { id: 'ambulance', label: 'Driver Cockpit', iconName: 'Truck' },
        { id: 'emergency', label: 'Assigned Trip', iconName: 'Activity', isCritical: true },
        { id: 'map', label: 'Live GPS Navigation', iconName: 'Map' },
        { id: 'discovery', label: 'Destination ER', iconName: 'Building' },
      ];

    case 'AMBULANCE_PROVIDER_ADMIN':
      return [
        { id: 'ambulance', label: 'Fleet Operations', iconName: 'Truck' },
        { id: 'emergency', label: 'Dispatch Queue', iconName: 'Activity', isCritical: true },
        { id: 'map', label: 'Fleet Telemetry Grid', iconName: 'Map' },
        { id: 'discovery', label: 'Partner Facilities', iconName: 'Building' },
      ];

    case 'LIFELINEX_ADMIN':
    case 'SUPER_ADMIN':
      return [
        { id: 'admin', label: 'Admin Command', iconName: 'Shield' },
        { id: 'emergency', label: 'Live Incident Grid', iconName: 'Activity', isCritical: true },
        { id: 'hospital', label: 'Hospitals', iconName: 'Building' },
        { id: 'bloodbank', label: 'Blood Banks', iconName: 'Droplet' },
        { id: 'ambulance', label: 'Fleet Units', iconName: 'Truck' },
        { id: 'donor', label: 'Donor Network', iconName: 'Heart' },
        { id: 'map', label: 'Unified Network Map', iconName: 'Map' },
        { id: 'appointments', label: 'Appointments', iconName: 'Calendar' },
        { id: 'ai', label: 'AI Operations', iconName: 'Sparkles' },
        { id: 'testing', label: 'Diagnostics & E2E', iconName: 'CheckCircle2' },
      ];

    default:
      return [
        { id: 'emergency', label: 'Emergency Help', iconName: 'Activity', isCritical: true },
        { id: 'appointments', label: 'Appointments', iconName: 'Calendar' },
        { id: 'map', label: 'Healthcare Map', iconName: 'Map' },
        { id: 'donor', label: 'Donor Mode', iconName: 'Heart' },
      ];
  }
}

export function getPrimaryHomeId(role: UserRoleType): string {
  switch (role) {
    case 'PATIENT':
      return 'home';
    case 'HOSPITAL_ADMIN':
    case 'HOSPITAL_STAFF':
      return 'hospital';
    case 'BLOOD_BANK_ADMIN':
    case 'BLOOD_BANK_STAFF':
      return 'bloodbank';
    case 'AMBULANCE_DRIVER':
    case 'AMBULANCE_PROVIDER_ADMIN':
      return 'ambulance';
    case 'DONOR':
      return 'donor';
    case 'LIFELINEX_ADMIN':
    case 'SUPER_ADMIN':
      return 'admin';
    default:
      return 'emergency';
  }
}
