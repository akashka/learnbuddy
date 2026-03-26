import { Link } from 'react-router-dom';

interface Action {
  type: string;
  title: string;
  message: string;
  href: string;
  count?: number;
}

interface PendingActionsProps {
  actions: Action[];
}

const TYPE_STYLES: Record<string, string> = {
  payment_failed: 'from-red-500 to-rose-600',
  pending_mapping: 'from-amber-500 to-orange-600',
  renewal: 'from-amber-500 to-yellow-600',
  dispute: 'from-violet-500 to-purple-600',
  pending_payment: 'from-emerald-500 to-teal-600',
};

export function PendingActions({ actions }: PendingActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      {actions.map((a) => (
        <Link
          key={a.type}
          to={a.href}
          className={`block overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-r ${TYPE_STYLES[a.type] || 'from-brand-500 to-violet-600'} p-5 text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="font-bold">
                  {a.title}
                  {a.count && a.count > 1 && ` (${a.count})`}
                </p>
                <p className="text-sm opacity-90">{a.message}</p>
              </div>
            </div>
            <span className="rounded-lg bg-white/20 px-4 py-2 font-semibold">View →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
