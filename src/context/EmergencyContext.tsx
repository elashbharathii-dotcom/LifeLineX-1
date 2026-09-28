import { createContext, useContext } from 'react';
import { EmergencySession, EmergencyEvent, EmergencyStatusType } from '../types/database';

interface EmergencyContextType {
  activeEmergency: EmergencySession | null;
  events: EmergencyEvent[];
  triggerSOS: (notes?: string) => Promise<EmergencySession>;
  updateStatus: (newStatus: EmergencyStatusType, title: string, description: string) => void;
  refreshEmergency: () => void;
}

export const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
