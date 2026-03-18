import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';

/**
 * Brand lockup per BRAND-GUIDELINES.md:
 * - Icon + wordmark (LearnBuddy)
 * - Tagline (Learn with fun.) below the wordmark
 */
interface BrandLogoProps {
  /** Link wrapper - omit for static display */
  to?: string;
  /** Icon size in pixels */
  iconSize?: number;
  /** Show tagline below wordmark */
  showTagline?: boolean;
  /** Compact: smaller, tagline hidden on narrow screens */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export function BrandLogo({
  to,
  iconSize = 36,
  showTagline = true,
  compact = false,
  className = '',
}: BrandLogoProps) {
  const content = (
    <>
      <img
        src="/logo.svg"
        alt={BRAND.name}
        className="shrink-0"
        width={iconSize}
        height={iconSize}
      />
      <div className="flex min-w-0 flex-col">
        <span className="font-display text-xl font-bold tracking-tight text-brand-800 truncate">
          {BRAND.name}
        </span>
        {showTagline && (
          <span
            className={`font-medium text-brand-600 truncate ${
              compact ? 'hidden text-xs sm:block sm:text-sm' : 'text-sm'
            }`}
          >
            {BRAND.tagline}
          </span>
        )}
      </div>
    </>
  );

  const wrapperClass = `flex items-center gap-2 sm:gap-3 ${className}`;

  if (to) {
    return (
      <Link to={to} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
