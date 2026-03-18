import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';

/**
 * Brand lockup per BRAND-GUIDELINES.md:
 * - Admin: Icon + LearnBuddy + "Admin" (accent color, below)
 * - Standard: Icon + LearnBuddy + tagline (below)
 */
interface BrandLogoProps {
  /** Link wrapper - omit for static display */
  to?: string;
  /** Icon size in pixels */
  iconSize?: number;
  /** Admin variant: shows "Admin" instead of tagline, in accent color */
  variant?: 'default' | 'admin';
  /** Show secondary line (tagline or Admin) */
  showTagline?: boolean;
  /** Collapsed sidebar: icon only */
  collapsed?: boolean;
  /** Size: sm for sidebar, md/lg for login/hero */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Optional click handler (e.g. close mobile menu) */
  onClick?: () => void;
}

export default function BrandLogo({
  to,
  iconSize,
  variant = 'admin',
  showTagline = true,
  collapsed = false,
  size = 'lg',
  className = '',
  onClick,
}: BrandLogoProps) {
  const iconDim = collapsed ? 32 : iconSize ?? (size === 'sm' ? 32 : size === 'md' ? 48 : 80);
  const secondaryText = variant === 'admin' ? 'Admin' : BRAND.tagline;
  const secondaryClass =
    variant === 'admin'
      ? 'text-sm font-medium text-accent-600'
      : 'text-lg font-medium text-indigo-600';
  const nameClass =
    size === 'sm'
      ? 'font-display text-base font-bold tracking-tight text-indigo-900'
      : size === 'md'
        ? 'font-display text-xl font-bold tracking-tight text-indigo-900'
        : 'font-display text-2xl font-bold tracking-tight text-indigo-900 md:text-4xl';

  const content = (
    <>
      <img
        src="/logo.svg"
        alt={BRAND.name}
        className="shrink-0"
        width={iconDim}
        height={iconDim}
      />
      {!collapsed && (
        <div className="flex min-w-0 flex-col">
          <span className={`truncate ${nameClass}`}>{BRAND.name}</span>
          {showTagline && (
            <span className={`truncate ${secondaryClass}`}>{secondaryText}</span>
          )}
        </div>
      )}
    </>
  );

  const wrapperClass = `flex items-center gap-4 ${className}`;

  if (to) {
    return (
      <Link to={to} className={wrapperClass} title={BRAND.name} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
