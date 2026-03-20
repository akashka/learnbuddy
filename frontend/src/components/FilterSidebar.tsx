/**
 * Filter sidebar with corner splashes, matching Teacher Batches style.
 */
interface FilterSidebarProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function FilterSidebar({ title = 'Filters', children, footer, className = '' }: FilterSidebarProps) {
  return (
    <aside className={`shrink-0 lg:w-72 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/20 to-accent-50 p-6 shadow-lg backdrop-blur-sm">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
        <h3 className="relative mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
          <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {title}
        </h3>
        <div className="relative space-y-5">{children}</div>
        {footer && <div className="relative mt-5 border-t border-gray-100 pt-4">{footer}</div>}
      </div>
    </aside>
  );
}
