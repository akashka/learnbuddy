/**
 * Trust badges (DPDP, BGV, secure payments, etc.) for use across the website.
 * Use variant="inline" for compact row, variant="section" for full section.
 */

export const TRUST_BADGES = [
  { id: 'dpdp', label: 'DPDP Compliant', icon: '🛡️', title: "India's Digital Personal Data Protection Act" },
  { id: 'bgv', label: 'BGV Verified', icon: '✅', title: 'Teachers screened & background verified' },
  { id: 'secure-payments', label: 'Secure Payments', icon: '🔐', title: 'Safe, encrypted payment processing' },
  { id: 'ai-monitored', label: 'AI Monitored', icon: '🤖', title: 'Every class monitored for safety' },
] as const;

type Variant = 'inline' | 'compact' | 'section';

interface TrustBadgesProps {
  variant?: Variant;
  className?: string;
}

export function TrustBadges({ variant = 'inline', className = '' }: TrustBadgesProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
        {TRUST_BADGES.map((b) => (
          <span
            key={b.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-white/80 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm sm:px-3 sm:py-1.5 sm:text-sm"
            title={b.title}
          >
            <span className="text-sm sm:text-base">{b.icon}</span>
            {b.label}
          </span>
        ))}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className={`rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-accent-50/50 p-6 shadow-sm sm:p-8 ${className}`}>
        <h3 className="font-display text-center text-lg font-bold text-brand-900 sm:text-xl">
          Trusted & Secure
        </h3>
        <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4">
          {TRUST_BADGES.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:text-base"
              title={b.title}
            >
              <span className="text-lg">{b.icon}</span>
              {b.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // inline (default)
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {TRUST_BADGES.map((b) => (
        <span
          key={b.id}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-200 hover:shadow-md sm:px-4 sm:py-2.5 sm:text-base"
          title={b.title}
        >
          <span className="text-base sm:text-lg">{b.icon}</span>
          {b.label}
        </span>
      ))}
    </div>
  );
}
