import { Link } from 'react-router-dom';
import { formatCurrency } from '@shared/formatters';

/** Minimal teacher fields used on marketplace / wishlist cards */
export interface TeacherMarketplaceProfile {
  _id: string;
  name?: string;
  photoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  experienceMonths?: number;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  feeStartsFrom?: number;
  bgvVerified?: boolean;
}

function formatExperience(months?: number): string {
  if (months == null || months <= 0) return '—';
  if (months >= 12) return `${Math.floor(months / 12)} yr${months >= 24 ? 's' : ''}`;
  return `${months} mo`;
}

function formatAge(dateOfBirth?: string): string {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return '—';
  const now = new Date();
  const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? `${age} yrs` : '—';
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: full }, (_, i) => (
        <span key={`f-${i}`}>★</span>
      ))}
      {half && <span className="opacity-80">★</span>}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e-${i}`} className="text-gray-300">
          ★
        </span>
      ))}
    </span>
  );
}

export function WishlistHeartButton({
  isInWishlist,
  onToggle,
  className = '',
}: {
  isInWishlist: boolean;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group/heart flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-gray-200/80 transition-all hover:scale-105 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isInWishlist ? (
        <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 text-gray-400 transition-colors group-hover/heart:text-rose-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}

/** Double blue ticks (read-receipt style) — BGV verified */
function BgvVerifiedBadge() {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      role="img"
      aria-label="Background verified"
      title="Background  verified"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-md ring-2 ring-white/90">
        <svg
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3.5 12.5l4 4L11 8" opacity={0.88} />
          <path d="M7.5 12.5l4 4L20.5 5" />
        </svg>
      </span>
    </span>
  );
}

export default function TeacherMarketplaceCard({
  teacher,
  index,
  isInWishlist,
  onWishlistToggle,
  switchEnrollmentId,
}: {
  teacher: TeacherMarketplaceProfile;
  index: number;
  isInWishlist?: boolean;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  switchEnrollmentId?: string | null;
}) {
  const tags = [teacher.board, teacher.subjects].flat().filter(Boolean).slice(0, 4);
  const hasRating = teacher.averageRating != null && teacher.averageRating > 0;

  return (
    <div
      className="group animate-slide-up relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-white bg-gradient-to-br from-white via-brand-50/35 to-accent-50/40 shadow-md ring-1 ring-brand-100/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {(teacher.bgvVerified || onWishlistToggle != null) && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          {teacher.bgvVerified && <BgvVerifiedBadge />}
          {onWishlistToggle != null && (
            <WishlistHeartButton
              isInWishlist={!!isInWishlist}
              onToggle={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWishlistToggle(e);
              }}
            />
          )}
        </div>
      )}
      <Link
        to={
          switchEnrollmentId
            ? `/parent/teacher/${teacher._id}?switchEnrollmentId=${encodeURIComponent(switchEnrollmentId)}`
            : `/parent/teacher/${teacher._id}`
        }
        className="relative z-0 flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-brand-200/15 blur-lg" />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/90 shadow-md ring-2 ring-brand-200/70 sm:h-[72px] sm:w-[72px]">
                {teacher.photoUrl ? (
                  <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200 text-3xl">
                    👩‍🏫
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2 pr-24">
                <h3 className="line-clamp-2 text-base font-bold leading-snug text-brand-900 sm:text-lg">
                  {teacher.name || 'Teacher'}
                </h3>
              </div>
              <dl className="mt-1.5 space-y-0.5 text-xs text-gray-600 sm:text-sm">
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>{teacher.gender || '—'}</span>
                  <span aria-hidden>•</span>
                  <span>{formatAge(teacher.dateOfBirth)}</span>
                  <span aria-hidden>•</span>
                  <span>{formatExperience(teacher.experienceMonths)} exp.</span>
                </div>
              </dl>
            </div>
          </div>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full truncate rounded-full border border-brand-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-brand-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-1 flex-col justify-end border-t border-brand-100/80 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                {hasRating && (
                  <span className="flex flex-wrap items-center gap-1 text-sm text-amber-700">
                    <StarRating rating={teacher.averageRating!} />
                    <span className="font-medium">{teacher.averageRating?.toFixed(1)}</span>
                    <span className="text-gray-500">({teacher.reviewCount || 0})</span>
                  </span>
                )}
                {teacher.feeStartsFrom != null && teacher.feeStartsFrom > 0 ? (
                  <p className="pt-3 text-base font-bold tabular-nums leading-tight text-brand-800 sm:text-lg">
                    {formatCurrency(teacher.feeStartsFrom ?? 0)}
                    <span className="text-xs font-medium text-gray-600"> / month Onwards</span>
                  </p>
                ) : (
                  <span className="text-sm leading-tight text-gray-500">Fee on request</span>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md ring-2 ring-white/40 transition duration-200 group-hover:shadow-xl group-hover:ring-brand-200/60">
                <span className="tracking-wide">View profile</span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-white/30"
                  aria-hidden
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
