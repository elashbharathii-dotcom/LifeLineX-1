import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emergency' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPill?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  isPill = true,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = `lx-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'lx-btn-sm' : size === 'lg' ? 'lx-btn-lg' : size === 'icon' ? 'lx-btn-icon' : size === 'icon-sm' ? 'lx-btn-icon-sm' : 'lx-btn-md';
  const shapeClass = isPill ? '' : 'lx-btn-rounded';

  return (
    <button
      className={`lx-btn ${variantClass} ${sizeClass} ${shapeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <Button
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      className={`p-0 ${className}`.trim()}
      {...props}
    >
      {icon}
    </Button>
  );
};

export interface BadgeProps {
  variant?: 'critical' | 'success' | 'warning' | 'info' | 'neutral' | 'primary';
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  showDot = false,
  className = '',
}) => {
  return (
    <span className={`lx-badge lx-badge-${variant} ${className}`}>
      {showDot && <span className="lx-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'default' | 'elevated';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  title,
  subtitle,
  headerAction,
  className = '',
  ...props
}) => {
  return (
    <div className={`lx-card ${variant === 'elevated' ? 'lx-card-elevated' : ''} ${className}`} {...props}>
      {(title || headerAction) && (
        <div className="lx-card-header">
          <div>
            {title && <h3 className="lx-card-title">{title}</h3>}
            {subtitle && <p className="lx-card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: string;
  variant?: 'primary' | 'critical' | 'success' | 'warning' | 'info';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div className={`lx-metric-card ${className}`}>
      <div className="flex items-center justify-between">
        <span className="lx-metric-label">{label}</span>
        {icon && (
          <div className="lx-metric-icon">
            {icon}
          </div>
        )}
      </div>
      <div className="lx-metric-value">{value}</div>
      {trend && <span className="lx-metric-trend">{trend}</span>}
    </div>
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="lx-empty">
      {icon && <div className="lx-empty-icon">{icon}</div>}
      <h4 className="lx-empty-title">{title}</h4>
      {description && <p className="lx-empty-desc">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Information Unavailable',
  message,
  onRetry,
}) => {
  return (
    <div className="lx-error">
      <h4 className="font-semibold text-rose-400">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  align = 'left',
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 ${align === 'center' ? 'text-center md:text-center' : ''} ${className}`}>
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
            {badge}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 bg-white border border-[var(--color-border-default)] shadow-sm mb-8 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f9faf8 100%)',
      }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              {icon}
            </div>
          )}
          <div>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                {badge}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  badge?: string;
  variant?: 'default' | 'primary' | 'emergency' | 'mint';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  variant = 'default',
  className = '',
}) => {
  let bgStyle = 'bg-white border-[var(--color-border-default)]';
  let titleColor = 'text-[var(--color-text-secondary)]';
  let valueColor = 'text-[var(--color-text-primary)]';

  if (variant === 'primary') {
    bgStyle = 'bg-[var(--color-primary)] text-white border-transparent';
    titleColor = 'text-teal-100';
    valueColor = 'text-white';
  } else if (variant === 'emergency') {
    bgStyle = 'bg-rose-50 border-rose-200';
    valueColor = 'text-rose-700';
  } else if (variant === 'mint') {
    bgStyle = 'bg-[#f4fae6] border-[#d7ec93]';
    valueColor = 'text-[var(--color-accent-mint-text)]';
  }

  return (
    <div className={`p-6 rounded-[24px] border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgStyle} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}>{title}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5">
            {icon}
          </div>
        )}
      </div>
      <div className={`text-3xl font-black tracking-tight ${valueColor}`}>{value}</div>
      {(subtitle || trend || badge) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {badge && (
            <span className="px-2 py-0.5 rounded-full font-bold bg-black/5">
              {badge}
            </span>
          )}
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value}
            </span>
          )}
          {subtitle && <span className="opacity-80">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'critical' | 'info' | 'neutral';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  pulse = false,
}) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-teal-50 text-teal-800 border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${styles}`}>
      {pulse && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
      <span>{status}</span>
    </span>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-200/80 rounded-2xl w-1/3" />
      <div className="h-4 bg-slate-200/60 rounded-xl w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/70 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{ type?: 'text' | 'heading' | 'card'; className?: string }> = ({
  type = 'text',
  className = '',
}) => {
  const typeClass =
    type === 'heading' ? 'lx-skeleton-heading' : type === 'card' ? 'lx-skeleton-card' : 'lx-skeleton-text';
  return <div className={`lx-skeleton ${typeClass} ${className}`} aria-hidden="true" />;
};
