import { Link } from 'react-router-dom';
import { BRAND } from '@shared/brand';

/**
 * Brand lockup per BRAND-GUIDELINES.md:
 * - Icon + wordmark (LearnBuddy)
 * - Tagline (Learn with fun.) below the wordmark
 */
interface BrandLogoProps {
  /** Internal link (react-router) */
  to?: string;
  /** External link (opens in new tab when used) */
  href?: string;
  /** Icon size in pixels */
  iconSize?: number;
  /** Show tagline below wordmark */
  showTagline?: boolean;
  /** Compact: smaller, tagline hidden on narrow screens */
  compact?: boolean;
  /** Large: hero/feature size for prominent display */
  size?: 'default' | 'large';
  /** Additional class names */
  className?: string;
}

export function BrandLogo({
  to,
  href,
  iconSize,
  showTagline = true,
  compact = false,
  size = 'default',
  className = '',
}: BrandLogoProps) {
  const isLarge = size === 'large';
  const resolvedIconSize = iconSize ?? (isLarge ? 96 : 36);
  const nameClass = isLarge
    ? 'font-display text-3xl font-bold tracking-tight text-brand-800 sm:text-4xl'
    : 'font-display text-xl font-bold tracking-tight text-brand-800 truncate';
  const taglineClass = isLarge
    ? 'text-base font-medium text-brand-600 sm:text-lg'
    : compact
      ? 'hidden text-xs font-medium text-brand-600 sm:block sm:text-sm truncate'
      : 'text-sm font-medium text-brand-600 truncate';
  const gapClass = isLarge ? 'gap-4 sm:gap-5' : 'gap-2 sm:gap-3';

  const content = (
    <>
      <img
        src="/logo.svg"
        alt={BRAND.name}
        className="shrink-0"
        width={resolvedIconSize}
        height={resolvedIconSize}
      />
      <div className="flex min-w-0 flex-col">
        <span className={nameClass}>{BRAND.name}</span>
        {showTagline && (
          <span className={taglineClass}>{BRAND.tagline}</span>
        )}
      </div>
    </>
  );

  const wrapperClass = `flex items-center ${gapClass} ${className}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
        {content}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
