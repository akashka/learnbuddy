import { resolveMediaUrl } from '@/lib/api';
import type { LearnerOption } from '@/hooks/useParentLearnerOptions';

type Props = {
  options: LearnerOption[];
  /** Empty string = "all learners" */
  selectedId: string;
  onChange: (studentMongoId: string | null) => void;
  className?: string;
  /** Section label above chips */
  label?: string;
};

/**
 * Shared “filter by learner” control: all learners + one chip per child with photo when available.
 */
export function LearnerFilterChips({
  options,
  selectedId,
  onChange,
  className = '',
  label = 'Filter by learner',
}: Props) {
  if (options.length === 0) return null;

  const chipBase =
    'inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold shadow-sm transition';

  return (
    <div className={`w-full max-w-4xl ${className}`}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`${chipBase} ${
            !selectedId
              ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-violet-50 text-brand-900 ring-2 ring-brand-400/40'
              : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50/50'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg" aria-hidden>
            👨‍👩‍👧
          </span>
          All learners
        </button>
        {options.map((opt) => {
          const active = selectedId === opt.id;
          const src = resolveMediaUrl(opt.photoUrl);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`${chipBase} max-w-full ${
                active
                  ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-violet-50 text-brand-900 ring-2 ring-brand-400/40'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50/50'
              }`}
            >
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-brand-100 to-violet-100 shadow-sm ring-1 ring-brand-200/80">
                {src ? (
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base" aria-hidden>
                    👤
                  </span>
                )}
              </span>
              <span className="min-w-0 max-w-[12rem] truncate">{opt.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
