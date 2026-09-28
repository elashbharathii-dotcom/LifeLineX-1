import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRoleType } from '../../types/database';
import { Shield, User, Heart, Building, Droplet, Truck } from 'lucide-react';

const roleMeta: Record<UserRoleType, { label: string; icon: React.ReactNode; color: string }> = {
  PATIENT: { label: 'Patient / Citizen', icon: <User className="w-3.5 h-3.5" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  DONOR: { label: 'Blood Donor', icon: <Heart className="w-3.5 h-3.5" />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  HOSPITAL_ADMIN: { label: 'Hospital Admin', icon: <Building className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  HOSPITAL_STAFF: { label: 'Hospital Staff', icon: <Building className="w-3.5 h-3.5" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  BLOOD_BANK_ADMIN: { label: 'Blood Bank Admin', icon: <Droplet className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  BLOOD_BANK_STAFF: { label: 'Blood Bank Staff', icon: <Droplet className="w-3.5 h-3.5" />, color: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
  AMBULANCE_PROVIDER_ADMIN: { label: 'Fleet Admin', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  AMBULANCE_DRIVER: { label: 'Ambulance Driver', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  LIFELINEX_ADMIN: { label: 'LifelineX Admin', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  SUPER_ADMIN: { label: 'Super Admin', icon: <Shield className="w-3.5 h-3.5" />, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
};

export const RoleSwitcher: React.FC = () => {
  const { profile, activeRole, allProfiles, switchUser, switchRole, availableRoles } = useAuth();

  return (
    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-1.5 shadow-md">
      {/* Profile / Persona Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">Active Persona:</span>
        <select
          value={profile?.id || ''}
          onChange={(e) => switchUser(e.target.value)}
          className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {allProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} ({p.blood_group || 'No BG'})
            </option>
          ))}
        </select>
      </div>

      {/* Role Badge & Switcher */}
      <div className="flex items-center gap-1">
        <select
          value={activeRole}
          onChange={(e) => switchRole(e.target.value as UserRoleType)}
          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border ${roleMeta[activeRole]?.color || 'bg-slate-800 text-slate-300'} focus:outline-none`}
        >
          {Object.entries(roleMeta)
            .filter(([roleKey]) => {
              // Security Guard: Never allow selecting admin roles unless
              // explicitly authorized in server-derived availableRoles
              if (roleKey === 'LIFELINEX_ADMIN' || roleKey === 'SUPER_ADMIN') {
                return availableRoles.includes(roleKey as UserRoleType);
              }
              return true;
            })
            .map(([roleKey, meta]) => (
              <option key={roleKey} value={roleKey} className="bg-slate-900 text-slate-100">
                {meta.label}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
