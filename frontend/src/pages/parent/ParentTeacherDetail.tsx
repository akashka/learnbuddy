import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { TeacherBadgeModal, type BadgeItem } from '@/components/TeacherBadgeModal';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@shared/formatters';
import { useWishlist } from '@/hooks/useWishlist';

const REVIEWS_PREVIEW_COUNT = 4;
const BATCH_PREVIEW_COUNT = 2;

interface Slot {
  day?: string;
  startTime?: string;
  endTime?: string;
}

interface Batch {
  name?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  feePerMonth?: number;
  slots?: Slot[];
  minStudents?: number;
  maxStudents?: number;
  startDate?: string;
  enrollmentOpen?: boolean;
  /** Original index in teacher.batches — use for checkout URLs */
  batchIndex?: number;
  enrolledCount?: number;
  hideFromParents?: boolean;
}

interface Review {
  rating: number;
  review?: string;
  parentName?: string;
  createdAt?: string;
}

interface Teacher {
  _id: string;
  name?: string;
  photoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  qualification?: string;
  profession?: string;
  languages?: string[];
  experienceMonths?: number;
  bio?: string;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  demoVideoUrl?: string;
  averageRating?: number | null;
  reviewCount?: number;
  batches?: Batch[];
  reviews?: Review[];
  bgvVerified?: boolean;
  documents?: { name?: string; verified?: boolean }[];
}

function getTeacherBadges(teacher: Teacher): BadgeItem[] {
  const badges: BadgeItem[] = [];
  if (teacher.bgvVerified) {
    badges.push({
      id: 'bgv',
      title: 'BGV Verified',
      description: 'Background verification completed. This teacher has been verified by our team.',
      icon: '✓',
    });
  }
  const verifiedDocs = (teacher.documents || []).filter((d) => d.verified);
  verifiedDocs.forEach((d, i) => {
    badges.push({
      id: `doc-${i}`,
      title: d.name || 'Document Verified',
      description: 'This document has been verified by our team.',
      icon: '📄',
    });
  });
  return badges;
}

function formatExperience(months?: number): string {
  if (months == null || months <= 0) return '—';
  if (months >= 12) return `${Math.floor(months / 12)} year(s)`;
  return `${months} month(s)`;
}

function formatAge(dateOfBirth?: string): string {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return '—';
  const now = new Date();
  const age = Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? `${age} years` : '—';
}

function getYouTubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  const watch = trimmed.match(/(?:youtube\.com\/watch\?v=)([^&\s#]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = trimmed.match(/youtu\.be\/([^?\s#]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const embed = trimmed.match(/youtube\.com\/embed\/([^?\s#]+)/);
  if (embed) return `https://www.youtube.com/embed/${embed[1]}`;
  return null;
}

function isDirectVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url.trim());
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
        <span key={`e-${i}`} className="text-gray-300">★</span>
      ))}
    </span>
  );
}

/** Section shell: gradient border, corner blurs, icon header */
function SectionCard({
  title,
  icon,
  children,
  className = '',
  delay = 0,
  sectionId,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Anchor id for in-page quick jumps */
  sectionId?: string;
}) {
  return (
    <section
      id={sectionId}
      className={`scroll-mt-28 animate-slide-up relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-white bg-gradient-to-br from-white via-brand-50/40 to-accent-50/30 p-6 shadow-lg ring-1 ring-brand-100/50 sm:p-7 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent-200/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-brand-200/15 blur-xl" />
      <h2 className="relative mb-4 flex items-center gap-3 text-lg font-bold text-brand-900">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200 text-xl shadow-inner ring-2 ring-white/80">
          {icon}
        </span>
        {title}
      </h2>
      <div className="relative">{children}</div>
    </section>
  );
}

function buildCheckoutHref(teacherId: string, checkoutBatchIndex: number, switchEnrollmentId: string | null) {
  const q = new URLSearchParams({
    teacherId,
    batchIndex: String(checkoutBatchIndex),
    duration: '3months',
  });
  if (switchEnrollmentId) q.set('switchEnrollmentId', switchEnrollmentId);
  return `/parent/checkout?${q.toString()}`;
}

function BatchCardContent({
  batch,
  teacherId,
  bookLabel,
  switchEnrollmentId,
}: {
  batch: Batch;
  teacherId: string;
  bookLabel: string;
  switchEnrollmentId?: string | null;
}) {
  const checkoutBatchIndex = batch.batchIndex ?? 0;
  const max = batch.maxStudents ?? 3;
  const enrolled = batch.enrolledCount ?? 0;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-brand-900">
          {batch.name || `${batch.subject} - ${batch.board} Class ${batch.classLevel}`}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {batch.subject} • {batch.board} • Class {batch.classLevel}
        </p>
        <p className="mt-2 text-sm font-semibold text-gray-800">
          {enrolled} of {max} students enrolled
        </p>
        {batch.slots && batch.slots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {batch.slots.map((slot, si) => (
              <span
                key={si}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-800"
              >
                {slot.day} {slot.startTime}–{slot.endTime}
              </span>
            ))}
          </div>
        )}
        {batch.startDate && (
          <p className="mt-2 text-sm text-gray-500">Starts: {formatDate(batch.startDate)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <span className="text-xl font-bold text-brand-700">{formatCurrency(batch.feePerMonth ?? 0)}/month</span>
        <Link
          to={buildCheckoutHref(teacherId, checkoutBatchIndex, switchEnrollmentId ?? null)}
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm sm:min-w-[140px]"
        >
          {bookLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function BatchesModal({
  isOpen,
  onClose,
  batches,
  teacherId,
  title,
  bookLabel,
  switchEnrollmentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  teacherId: string;
  title: string;
  bookLabel: string;
  switchEnrollmentId?: string | null;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[min(88vh,820px)] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-5 py-4 sm:px-6">
          <h2 id="batches-modal-title" className="pr-2 text-lg font-bold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {batches.length === 0 ? (
            <p className="text-sm text-gray-600">No batches available.</p>
          ) : (
            <ul className="space-y-4" aria-labelledby="batches-modal-title">
              {batches.map((batch) => (
                <li
                  key={batch.batchIndex ?? batch.name}
                  className="rounded-xl border-2 border-brand-100 bg-brand-50/40 p-4 shadow-sm ring-1 ring-gray-900/5"
                >
                  <BatchCardContent
                    batch={batch}
                    teacherId={teacherId}
                    bookLabel={bookLabel}
                    switchEnrollmentId={switchEnrollmentId}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="shrink-0 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReviewsModal({
  isOpen,
  onClose,
  reviews,
}: {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[min(85vh,800px)] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-white">All reviews ({reviews.length})</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <ul className="space-y-4">
            {reviews.map((r, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <StarRating rating={r.rating} />
                  <span className="text-xs text-gray-500 sm:text-sm">
                    {r.parentName || 'Parent'} • {r.createdAt ? formatDate(r.createdAt) : ''}
                  </span>
                </div>
                {r.review ? <p className="text-sm leading-relaxed text-gray-700">{r.review}</p> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TeachingFocusSection({
  board,
  classes,
  subjects,
  delay,
}: {
  board?: string[];
  classes?: string[];
  subjects?: string[];
  delay: number;
}) {
  const row = (label: string, items: string[] | undefined, classPrefix?: string) => (
    <div className="flex flex-col gap-2 border-brand-100/90 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:gap-6 sm:pb-5">
      <h3 className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-brand-700/80 sm:w-28 sm:pt-1.5">
        {label}
      </h3>
      <div className="flex min-h-[2.25rem] min-w-0 flex-1 flex-wrap content-start gap-2">
        {items && items.length > 0 ? (
          items.map((x) => {
            const display =
              classPrefix && !/^class\s/i.test(String(x).trim()) ? `${classPrefix}${x}` : x;
            return (
              <span
                key={`${label}-${x}`}
                className="inline-flex items-center rounded-full border border-brand-200/90 bg-white/90 px-3 py-1.5 text-sm font-medium text-brand-900 shadow-sm ring-1 ring-brand-100/60"
              >
                {display}
              </span>
            );
          })
        ) : (
          <span className="text-sm text-gray-500">—</span>
        )}
      </div>
    </div>
  );

  return (
    <SectionCard title="Teaching focus" icon="🎯" delay={delay} sectionId="section-teaching-focus">
      <div className="flex flex-col gap-0">
        {row('Boards', board)}
        {row('Classes', classes, 'Class ')}
        {row('Subjects', subjects)}
      </div>
    </SectionCard>
  );
}

function QuickJumpLink({ id, label }: { id: string; label: string }) {
  return (
    <a
      href={`#${id}`}
      className="block rounded-lg px-2 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-100/80 hover:text-brand-950"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${id}`);
      }}
    >
      {label}
    </a>
  );
}

function BadgesSection({
  badges,
  onOpenModal,
  delay,
}: {
  badges: BadgeItem[];
  onOpenModal: () => void;
  delay: number;
}) {
  return (
    <SectionCard title="Badges & verifications" icon="🏅" delay={delay} sectionId="section-badges">
      {badges.length === 0 ? (
        <p className="text-sm text-gray-600">No badges listed yet.</p>
      ) : (
        <ul className="space-y-3">
          {badges.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={onOpenModal}
                className="flex w-full items-start gap-3 rounded-xl border border-brand-100 bg-white/90 p-3 text-left shadow-sm ring-1 ring-gray-900/5 transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg">
                  {b.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-900">{b.title}</span>
                  <span className="mt-0.5 line-clamp-2 text-xs text-gray-600">{b.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {badges.length > 0 && (
        <button
          type="button"
          onClick={onOpenModal}
          className="mt-4 w-full rounded-xl border border-brand-200 bg-white/80 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
        >
          View full details
        </button>
      )}
    </SectionCard>
  );
}

export default function ParentTeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const switchEnrollmentId = searchParams.get('switchEnrollmentId');
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [bookBatchModalOpen, setBookBatchModalOpen] = useState(false);
  const [heroCompact, setHeroCompact] = useState(false);
  const { t } = useLanguage();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const onScroll = () => {
      setHeroCompact(window.scrollY > 72);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchTeacher = useCallback(() => {
    if (!id) return;
    setError(null);
    setLoading(true);
    apiJson<Teacher>(`/api/teachers/${id}`)
      .then(setTeacher)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const batches = teacher?.batches || [];
  const visibleBatches = useMemo(
    () => batches.filter((b) => !b.hideFromParents),
    [batches]
  );
  const reviews = teacher?.reviews || [];
  const hasRating = teacher?.averageRating != null && teacher.averageRating > 0;
  const badges = teacher ? getTeacherBadges(teacher) : [];

  const previewReviews = useMemo(() => reviews.slice(0, REVIEWS_PREVIEW_COUNT), [reviews]);
  const hasMoreReviews = reviews.length > REVIEWS_PREVIEW_COUNT;

  const previewBatches = useMemo(() => visibleBatches.slice(0, BATCH_PREVIEW_COUNT), [visibleBatches]);
  const hasMoreBatches = visibleBatches.length > BATCH_PREVIEW_COUNT;

  const youtubeEmbed = teacher?.demoVideoUrl ? getYouTubeEmbedUrl(teacher.demoVideoUrl) : null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading teacher profile...</p>
      </div>
    );
  }

  if (error) return <InlineErrorDisplay error={error} onRetry={fetchTeacher} fullPage />;
  if (!teacher) return <div className="text-red-600">Teacher not found.</div>;

  return (
    <div className="w-full min-w-0 animate-fade-in">
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 sm:px-6 lg:px-8">
        {switchEnrollmentId && (
          <div className="mb-4 animate-slide-up rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-violet-50 px-4 py-3 text-sm font-semibold text-amber-950 shadow-md ring-1 ring-amber-200/60">
            <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg shadow-inner" aria-hidden>
              🔁
            </span>
            Choosing a <strong>new teacher</strong> for your current enrollment — checkout applies a calendar{' '}
            <strong>pro-rata</strong> for this month (fair split + credit toward your new package).
          </div>
        )}
        {/* Sticky hero — expands at top; compact 1–2 line bar when scrolled */}
        <div
          className={`sticky top-20 z-30 mb-8 overflow-hidden rounded-2xl border-2 border-brand-200/90 bg-white shadow-xl ring-1 ring-brand-100/60 transition-shadow duration-300 ${heroCompact ? 'shadow-lg' : ''}`}
        >
          <div className="relative bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 transition-[padding] duration-300 ease-out">
            {!heroCompact && (
              <>
                <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 right-24 h-28 w-28 rounded-full bg-white/5" />
              </>
            )}

            {heroCompact ? (
              <div className="relative z-20 flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
                <Link
                  to="/parent/marketplace"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/35 bg-white/95 text-brand-700 shadow-md ring-1 ring-white/50 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/80"
                  title="Back to marketplace"
                  aria-label="Back to marketplace"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/90 shadow-md ring-1 ring-white/40 sm:h-11 sm:w-11">
                  {teacher.photoUrl ? (
                    <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/20 text-xl">👩‍🏫</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <h1 className="truncate text-base font-bold leading-tight text-white sm:text-lg">
                      {teacher.name || 'Teacher'}
                    </h1>
                    {teacher.bgvVerified && (
                      <span className="shrink-0 rounded-full bg-green-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        BGV
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/85 sm:text-[13px]">
                    <span>{formatExperience(teacher.experienceMonths)}</span>
                    <span className="text-white/50"> · </span>
                    <span>{teacher.gender || '—'}</span>
                    <span className="text-white/50"> · </span>
                    <span>{formatAge(teacher.dateOfBirth)}</span>
                    {hasRating && (
                      <>
                        <span className="text-white/50"> · </span>
                        <span>
                          ★ {teacher.averageRating?.toFixed(1)} ({teacher.reviewCount || 0})
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {id ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isInWishlist(id)) await removeFromWishlist(id);
                      else await addToWishlist(id);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
                    title={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-label={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {isInWishlist(id) ? (
                      <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="relative z-20 flex w-full flex-wrap items-center justify-between gap-3 border-b border-white/20 bg-black/15 px-4 py-3.5 sm:px-6 sm:py-4">
                  <Link
                    to="/parent/marketplace"
                    className="group/back inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-sm font-bold text-brand-700 shadow-md ring-1 ring-white/40 transition hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/80"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition group-hover/back:-translate-x-0.5">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </span>
                    <span className="pr-1">Back to marketplace</span>
                  </Link>
                  {id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (isInWishlist(id)) await removeFromWishlist(id);
                        else await addToWishlist(id);
                      }}
                      className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 transition-all hover:scale-105 hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
                      title={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-label={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {isInWishlist(id) ? (
                        <svg className="h-6 w-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-gray-500 transition-colors hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  ) : null}
                </div>

                <div className="relative px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-white/30 sm:h-32 sm:w-32">
                        {teacher.photoUrl ? (
                          <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/20 text-5xl backdrop-blur-sm">
                            👩‍🏫
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">{teacher.name || 'Teacher'}</h1>
                        {teacher.bgvVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white">
                            ✓ BGV Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-white/90 sm:grid-cols-2">
                        <span>Gender: {teacher.gender || '—'}</span>
                        <span>Age: {formatAge(teacher.dateOfBirth)}</span>
                        <span>Experience: {formatExperience(teacher.experienceMonths)}</span>
                        {hasRating && (
                          <span className="flex items-center gap-1.5">
                            <StarRating rating={teacher.averageRating!} />
                            {teacher.averageRating?.toFixed(1)} ({teacher.reviewCount || 0} reviews)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-8 lg:col-span-2">
            <TeachingFocusSection
              board={teacher.board}
              classes={teacher.classes}
              subjects={teacher.subjects}
              delay={0}
            />

            <BadgesSection badges={badges} onOpenModal={() => setBadgeModalOpen(true)} delay={0.02} />

            {teacher.bio && (
              <SectionCard title="About" icon="📝" delay={0.03} sectionId="section-about">
                <p className="leading-relaxed text-gray-700">{teacher.bio}</p>
              </SectionCard>
            )}

            <SectionCard title="Details" icon="📋" delay={0.06} sectionId="section-details">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Name</dt>
                  <dd className="mt-0.5 text-brand-900">{teacher.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Gender</dt>
                  <dd className="mt-0.5 text-brand-900">{teacher.gender || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Age</dt>
                  <dd className="mt-0.5 text-brand-900">{formatAge(teacher.dateOfBirth)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Experience</dt>
                  <dd className="mt-0.5 text-brand-900">{formatExperience(teacher.experienceMonths)}</dd>
                </div>
                {teacher.qualification && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Qualification</dt>
                    <dd className="mt-0.5 text-brand-900">{teacher.qualification}</dd>
                  </div>
                )}
                {teacher.profession && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Profession</dt>
                    <dd className="mt-0.5 text-brand-900">{teacher.profession}</dd>
                  </div>
                )}
                {teacher.languages && teacher.languages.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600">Languages</dt>
                    <dd className="mt-0.5 text-brand-900">{teacher.languages.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>

            <SectionCard title="Available batches" icon="📅" delay={0.09} sectionId="section-batches">
              <div className="space-y-4">
                {visibleBatches.length === 0 ? (
                  <p className="text-gray-600">No batches open for enrollment at the moment.</p>
                ) : (
                  <>
                    <ul className="space-y-4">
                      {previewBatches.map((batch, idx) => (
                        <li
                          key={batch.batchIndex ?? idx}
                          className="animate-slide-up rounded-xl border-2 border-brand-200/80 bg-white p-5 shadow-md transition hover:border-brand-300 hover:shadow-lg"
                          style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
                        >
                          <BatchCardContent
                            batch={batch}
                            teacherId={teacher._id}
                            bookLabel={t('bookNow')}
                            switchEnrollmentId={switchEnrollmentId}
                          />
                        </li>
                      ))}
                    </ul>
                    {hasMoreBatches && (
                      <button
                        type="button"
                        onClick={() => setBatchesModalOpen(true)}
                        className="w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/80 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100/80"
                      >
                        View all {visibleBatches.length} batches
                      </button>
                    )}
                  </>
                )}
              </div>
            </SectionCard>

            {reviews.length > 0 && (
              <SectionCard title={`Reviews (${reviews.length})`} icon="💬" delay={0.12} sectionId="section-reviews">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {previewReviews.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col rounded-xl border border-brand-100 bg-white/90 p-4 shadow-sm ring-1 ring-gray-900/5"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <StarRating rating={r.rating} />
                          <span className="text-xs text-gray-500">
                            {r.createdAt ? formatDate(r.createdAt) : ''}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-brand-900">{r.parentName || 'Parent'}</p>
                        {r.review ? (
                          <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-gray-700">{r.review}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {hasMoreReviews && (
                    <button
                      type="button"
                      onClick={() => setReviewsModalOpen(true)}
                      className="w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/80 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100/80"
                    >
                      View all {reviews.length} reviews
                    </button>
                  )}
                </div>
              </SectionCard>
            )}

            {teacher.demoVideoUrl && (
              <SectionCard title={t('demoVideo') || 'Demo video'} icon="🎬" delay={0.15} sectionId="section-demo">
                <div className="space-y-4">
                  {youtubeEmbed ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-2 ring-brand-100/80">
                      <iframe
                        title="Teacher demo video"
                        src={youtubeEmbed}
                        className="absolute inset-0 h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : isDirectVideoFileUrl(teacher.demoVideoUrl) ? (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                      <video
                        controls
                        playsInline
                        className="w-full max-h-[min(70vh,420px)] rounded-lg bg-black"
                        src={teacher.demoVideoUrl}
                      >
                        <track kind="captions" />
                      </video>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-6 text-center">
                      <p className="mb-4 text-sm text-gray-600">
                        Watch the teacher&apos;s introduction or demo on the original platform.
                      </p>
                      <a
                        href={teacher.demoVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2 px-6 py-3"
                      >
                        <span>Watch demo video</span>
                        <span aria-hidden>↗</span>
                      </a>
                    </div>
                  )}
                  {(youtubeEmbed || isDirectVideoFileUrl(teacher.demoVideoUrl)) && (
                    <a
                      href={teacher.demoVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline"
                    >
                      Open in new tab
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-[24%] lg:self-start">
              <nav
                aria-label="On this page"
                className="relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-white via-brand-50/50 to-accent-50/40 p-5 shadow-xl ring-1 ring-brand-100/60"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-200/25 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-xl" />
                <h3 className="relative mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-violet-100 text-base shadow-inner">
                    📍
                  </span>
                  Quick jumps
                </h3>
                <ul className="relative flex flex-col gap-0.5 border-t border-brand-100/80 pt-3">
                  <li>
                    <QuickJumpLink id="section-teaching-focus" label="Teaching focus" />
                  </li>
                  <li>
                    <QuickJumpLink id="section-badges" label="Badges & verifications" />
                  </li>
                  {teacher.bio ? (
                    <li>
                      <QuickJumpLink id="section-about" label="About" />
                    </li>
                  ) : null}
                  <li>
                    <QuickJumpLink id="section-details" label="Details" />
                  </li>
                  <li>
                    <QuickJumpLink id="section-batches" label="Available batches" />
                  </li>
                  {reviews.length > 0 ? (
                    <li>
                      <QuickJumpLink id="section-reviews" label={`Reviews (${reviews.length})`} />
                    </li>
                  ) : null}
                  {teacher.demoVideoUrl ? (
                    <li>
                      <QuickJumpLink id="section-demo" label={t('demoVideo') || 'Demo video'} />
                    </li>
                  ) : null}
                </ul>
              </nav>

              {visibleBatches.length > 0 && (
                <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-lg">
                  <p className="mb-4 text-sm text-gray-600">
                    Choose a batch to continue to checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookBatchModalOpen(true)}
                    className="btn-primary flex w-full items-center justify-center gap-2"
                  >
                    {t('bookNow')}
                    <span aria-hidden>→</span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <TeacherBadgeModal
        isOpen={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
        teacherName={teacher.name || 'Teacher'}
        badges={badges}
      />
      <ReviewsModal isOpen={reviewsModalOpen} onClose={() => setReviewsModalOpen(false)} reviews={reviews} />
      <BatchesModal
        isOpen={batchesModalOpen}
        onClose={() => setBatchesModalOpen(false)}
        batches={visibleBatches}
        teacherId={teacher._id}
        title="All batches"
        bookLabel={t('bookNow')}
        switchEnrollmentId={switchEnrollmentId}
      />
      <BatchesModal
        isOpen={bookBatchModalOpen}
        onClose={() => setBookBatchModalOpen(false)}
        batches={visibleBatches}
        teacherId={teacher._id}
        title="Select a batch"
        bookLabel={t('bookNow')}
        switchEnrollmentId={switchEnrollmentId}
      />
    </div>
  );
}
