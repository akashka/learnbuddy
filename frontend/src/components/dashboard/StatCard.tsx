interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  gradient?: string;
  trend?: 'up' | 'down' | 'stable';
}

export function StatCard({ icon, label, value, subtext, gradient = 'from-brand-500 to-violet-600', trend }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg transition-transform hover:scale-[1.02]`}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtext && <p className="mt-0.5 text-xs opacity-80">{subtext}</p>}
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
      {trend && (
        <span
          className={`absolute right-4 bottom-3 text-xs font-medium ${
            trend === 'up' ? 'text-emerald-200' : trend === 'down' ? 'text-rose-200' : 'text-white/80'
          }`}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}
