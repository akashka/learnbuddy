/**
 * Filter sidebar with corner splashes, matching Teacher Batches style.
 */
interface FilterSidebarProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Wider panel + roomier controls (e.g. marketplace) */
  spacious?: boolean;
  /** Title row action (e.g. clear-filters icon button) — aligned top-right next to title */
  headerAction?: React.ReactNode;
  /** When true, filter fields scroll inside the card; title + footer stay visible */
  scrollBody?: boolean;
  /** Extra classes on the scrollable body (e.g. scrollbar styling) */
  scrollBodyClassName?: string;
  /** Extra classes merged onto the inner card (e.g. marketplace neutral surface) */
  cardClassName?: string;
  /** Omit decorative blur orbs (cleaner e‑commerce look) */
  plainSurface?: boolean;
}

export function FilterSidebar({
  title = 'Filters',
  children,
  footer,
  className = '',
  spacious = false,
  headerAction,
  scrollBody = false,
  scrollBodyClassName = '',
  cardClassName = '',
  plainSurface = false,
}: FilterSidebarProps) {
  const width = spacious ? 'lg:w-[22rem]' : 'lg:w-72';
  const innerPad = spacious ? 'px-7 sm:px-8' : 'px-6';
  const gap = spacious ? 'space-y-6' : 'space-y-5';

  const renderTitleRow = (plain: boolean) => (
    <h3
      className={`relative flex min-w-0 items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] ${plain ? 'text-gray-800' : 'text-brand-700/80'}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${plain ? 'bg-gray-100 text-gray-700' : 'bg-brand-100 text-brand-600 shadow-inner'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </span>
        <span className="truncate">{title}</span>
      </span>
      {headerAction ? <span className="shrink-0">{headerAction}</span> : null}
    </h3>
  );

  if (scrollBody) {
    const cardBase = plainSurface
      ? 'relative flex max-h-[min(100%,calc(100vh-8rem))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/5'
      : 'relative flex max-h-[min(100%,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/30 to-accent-50/40 shadow-lg backdrop-blur-sm';
    return (
      <aside className={`shrink-0 ${width} ${className}`}>
        <div className={`${cardBase} ${cardClassName}`}>
          {!plainSurface && (
            <>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-200/25 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-200/20 blur-lg" />
            </>
          )}
          <div className={`relative mb-3 shrink-0 border-b pt-3 ${plainSurface ? 'border-gray-100' : 'border-transparent'} ${innerPad} pb-3`}>
            {renderTitleRow(plainSurface)}
          </div>
          <div
            className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${innerPad} pb-4 pt-0 ${scrollBodyClassName}`}
          >
            <div className={`${gap} [&>*:first-child]:pt-4`}>{children}</div>
          </div>
          {footer && (
            <div
              className={`relative shrink-0 border-t pt-5 ${plainSurface ? 'border-gray-200 bg-gray-50/50' : 'border-brand-100/80'} ${innerPad} pb-7 ${spacious ? 'sm:pb-8' : ''}`}
            >
              {footer}
            </div>
          )}
        </div>
      </aside>
    );
  }

  const legacyPad = spacious ? 'p-7 sm:p-8' : 'p-6';
  return (
    <aside className={`shrink-0 ${width} ${className}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/30 to-accent-50/40 shadow-lg backdrop-blur-sm ${legacyPad}`}
      >
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-200/25 blur-xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-brand-200/20 blur-lg" />
        <div className="relative mb-6">{renderTitleRow(false)}</div>
        <div className={`relative ${gap}`}>{children}</div>
        {footer && <div className="relative mt-6 border-t border-brand-100/80 pt-5">{footer}</div>}
      </div>
    </aside>
  );
}
