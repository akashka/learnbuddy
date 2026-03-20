/**
 * Gradient page header matching Teacher Batches style.
 * Use for consistent look across dashboard and list pages.
 */
interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-lg">
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-lg backdrop-blur-sm animate-bounce-subtle">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-white/90">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
