/**
 * Content card with gradient, corner splashes, optional rotating circles.
 * Matching Teacher Batches card style.
 */
interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  /** Show decorative elements (splashes, rotating circles) */
  decorative?: boolean;
  /** Disabled state - grayer look */
  disabled?: boolean;
}

export function ContentCard({ children, className = '', decorative = true, disabled = false }: ContentCardProps) {
  return (
    <div
      className={`card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300 ${
        disabled
          ? 'border-gray-200 bg-gray-50/70'
          : 'border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 hover:border-brand-300 hover:shadow-xl'
      } ${className}`}
    >
      {decorative && !disabled && (
        <>
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent-200/40 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-200/35 blur-xl" />
          <div className="absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-300/40 animate-rotate-slow pointer-events-none" />
          <div className="absolute -right-4 top-8 h-16 w-16 rounded-full border border-brand-200/50 pointer-events-none" style={{ animation: 'rotate-slow 15s linear infinite reverse' }} />
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
