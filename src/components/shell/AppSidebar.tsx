import React from 'react';
import { NavItem } from '../../lib/navItems';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  User,
  Activity,
  Heart,
  Building,
  Droplet,
  Truck,
  Calendar,
  Sparkles,
  Shield,
  CheckCircle2,
  Users,
  Compass,
  Baby,
  X,
} from 'lucide-react';

interface AppSidebarProps {
  isOpen: boolean;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
  Droplet: <Droplet className="w-4 h-4" />,
  Truck: <Truck className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  Baby: <Baby className="w-4 h-4" />,
};

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  navItems,
  activeTab,
  onTabChange,
  onClose,
}) => {
  const { profile, activeRole } = useAuth();

  // Check if navItems have section headers
  const hasSections = navItems.some((n) => !!n.section);

  const renderNavButtons = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = activeTab === item.id;
      const isCritical = item.isCritical;
      return (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`lx-nav-item ${isCritical ? 'lx-nav-item-critical' : ''} ${
            isActive ? 'active' : ''
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="flex-shrink-0" aria-hidden="true">
            {iconMap[item.iconName] || <Compass className="w-4 h-4" />}
          </span>
          <span className="lx-truncate flex-1 text-left">{item.label}</span>
          {isCritical && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="High Priority" />
          )}
        </button>
      );
    });
  };

  return (
    <aside
      className={`lx-sidebar ${isOpen ? 'open' : ''}`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand */}
      <div className="lx-brand">
        <div className="lx-brand-icon" aria-hidden="true">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="lx-brand-name">
            Lifeline<span>X</span>
          </div>
          <div className="lx-brand-tagline">Emergency Health Network</div>
        </div>
        <button
          onClick={onClose}
          className="lx-icon-btn lg:hidden"
          aria-label="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role Profile Badge */}
      <div className="lx-role-badge">
        <div className="lx-role-avatar" aria-hidden="true">
          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="lx-role-info">
          <div className="lx-role-name" title={profile?.full_name || 'Active User'}>
            {profile?.full_name || 'Active User'}
          </div>
          <div className="lx-role-label">{activeRole.replace(/_/g, ' ')}</div>
        </div>
      </div>

      {/* Navigation Links with Sections */}
      <nav className="lx-nav-section space-y-4" aria-label="Role modules">
        {hasSections ? (
          <>
            {/* MAIN */}
            {navItems.filter((n) => n.section === 'MAIN').length > 0 && (
              <div>
                <div className="lx-nav-section-label text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                  MAIN
                </div>
                <div className="space-y-0.5">
                  {renderNavButtons(navItems.filter((n) => n.section === 'MAIN'))}
                </div>
              </div>
            )}

            {/* HEALTH */}
            {navItems.filter((n) => n.section === 'HEALTH').length > 0 && (
              <div>
                <div className="lx-nav-section-label text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                  HEALTH
                </div>
                <div className="space-y-0.5">
                  {renderNavButtons(navItems.filter((n) => n.section === 'HEALTH'))}
                </div>
              </div>
            )}

            {/* SUPPORT */}
            {navItems.filter((n) => n.section === 'SUPPORT').length > 0 && (
              <div>
                <div className="lx-nav-section-label text-[10px] font-bold tracking-wider text-slate-400 mb-1">
                  SUPPORT
                </div>
                <div className="space-y-0.5">
                  {renderNavButtons(navItems.filter((n) => n.section === 'SUPPORT'))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <div className="lx-nav-section-label">Command Modules</div>
            <div className="space-y-0.5">{renderNavButtons(navItems)}</div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="lx-sidebar-footer">
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Node Connected • ISO 27799</span>
        </div>
      </div>
    </aside>
  );
};
