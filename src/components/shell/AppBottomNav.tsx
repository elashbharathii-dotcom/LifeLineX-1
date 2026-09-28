import React from 'react';
import { NavItem } from '../../lib/navItems';
import {
  Home,
  User,
  HeartPulse,
  Heart,
  Building,
  Droplet,
  Truck,
  Calendar,
  Sparkles,
  Shield,
  CheckCircle2,
  Compass,
  Baby,
  MapPin,
  Search
} from 'lucide-react';

interface AppBottomNavProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  unreadCount: number;
}

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  Activity: <HeartPulse className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  Droplet: <Droplet className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Compass: <Compass className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Discovery: <Search className="w-5 h-5" />,
  Map: <MapPin className="w-5 h-5" />,
};

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  navItems,
  activeTab,
  onTabChange,
}) => {
  // Mobile bottom navigation items:
  // Home, Emergency, Healthcare (Discovery/Map), Appointments, Profile
  const orderedTabIds = ['home', 'emergency', 'discovery', 'appointments', 'profile'];
  
  // Pick items according to ordered list if available, or fall back to navItems
  const bottomItems = orderedTabIds
    .map((id) => navItems.find((n) => n.id === id))
    .filter(Boolean) as NavItem[];

  const displayItems = bottomItems.length >= 3 ? bottomItems : navItems.slice(0, 5);

  return (
    <nav
      className="lx-bottom-nav bg-white/95 backdrop-blur-md border-t border-[var(--color-border-default)] shadow-lg"
      aria-label="Mobile Navigation Bar"
    >
      {displayItems.map((item) => {
        const isActive = activeTab === item.id;
        const isEmergency = item.id === 'emergency' || item.isCritical;

        if (isEmergency) {
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative -top-3 flex flex-col items-center justify-center p-1.5 focus:outline-none"
              aria-label="Emergency SOS"
            >
              <div className="lx-btn lx-btn-emergency w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg border-4 border-white transition-transform active:scale-95 p-0">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider mt-0.5">
                SOS
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
              isActive
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={isActive ? 'scale-110 transition-transform' : ''}>
              {iconMap[item.iconName] || <Compass className="w-5 h-5" />}
            </span>
            <span className="text-[10px] font-medium mt-1 truncate max-w-[56px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
