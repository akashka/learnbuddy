import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { TeacherBadgeModal, type BadgeItem } from '@/components/TeacherBadgeModal';
import { formatCurrency, formatDate } from '@shared/formatters';
import { useWishlist } from '@/hooks/useWishlist';

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

export default function ParentTeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const { t } = useLanguage();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

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

  const batches = teacher.batches || [];
  const reviews = teacher.reviews || [];
  const hasRating = teacher.averageRating != null && teacher.averageRating > 0;
  const badges = getTeacherBadges(teacher);

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-4">
        <Link
          to="/parent/marketplace"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Back to Marketplace
        </Link>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-xl">
        <div className="relative bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-8 sm:px-10">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-24 h-28 w-28 rounded-full bg-white/5" />
          {id && (
            <button
              type="button"
              onClick={async () => {
                if (isInWishlist(id)) await removeFromWishlist(id);
                else await addToWishlist(id);
              }}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg ring-1 ring-black/5 transition-all hover:scale-110 hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              title={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-label={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist(id) ? (
                <svg className="h-6 w-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-gray-400 transition-colors hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-white/30">
                {teacher.photoUrl ? (
                  <img src={teacher.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/20 text-5xl backdrop-blur-sm">
                    👩‍🏫
                  </div>
                )}
              </div>
              {badges.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setBadgeModalOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white shadow-lg transition hover:bg-green-600"
                  title="View badges"
                >
                  {badges.length}
                </button>
              )}
            </div>
            <div className="flex-1">
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
              <div className="mt-3 flex flex-wrap gap-2 text-white/90">
                {teacher.board?.map((b) => (
                  <span key={b} className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm">{b}</span>
                ))}
                {teacher.classes?.map((c) => (
                  <span key={c} className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm">Class {c}</span>
                ))}
                {teacher.subjects?.map((s) => (
                  <span key={s} className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {teacher.bio && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-800">
                  <span className="text-xl">📝</span> About
                </h2>
                <p className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-gray-700 leading-relaxed">
                  {teacher.bio}
                </p>
              </section>
            )}

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-800">
                <span className="text-xl">📋</span> Details
              </h2>
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-600">Name</dt>
                    <dd className="text-brand-800">{teacher.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Gender</dt>
                    <dd className="text-brand-800">{teacher.gender || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Age</dt>
                    <dd className="text-brand-800">{formatAge(teacher.dateOfBirth)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Experience</dt>
                    <dd className="text-brand-800">{formatExperience(teacher.experienceMonths)}</dd>
                  </div>
                  {teacher.qualification && (
                    <>
                      <div>
                        <dt className="font-medium text-gray-600">Qualification</dt>
                        <dd className="text-brand-800">{teacher.qualification}</dd>
                      </div>
                    </>
                  )}
                  {teacher.profession && (
                    <div>
                      <dt className="font-medium text-gray-600">Profession</dt>
                      <dd className="text-brand-800">{teacher.profession}</dd>
                    </div>
                  )}
                  {teacher.languages && teacher.languages.length > 0 && (
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-gray-600">Languages</dt>
                      <dd className="text-brand-800">{teacher.languages.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-800">
                <span className="text-xl">📅</span> Available Batches
              </h2>
              <div className="space-y-4">
                {batches.length === 0 ? (
                  <p className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 text-gray-600">
                    No batches available at the moment.
                  </p>
                ) : (
                  batches.map((batch, idx) => (
                    <div
                      key={idx}
                      className="animate-slide-up rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-md transition hover:border-brand-300 hover:shadow-lg"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-bold text-brand-800">{batch.name || `${batch.subject} - ${batch.board} Class ${batch.classLevel}`}</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {batch.subject} • {batch.board} • Class {batch.classLevel}
                          </p>
                          {batch.slots && batch.slots.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {batch.slots.map((slot, si) => (
                                <span
                                  key={si}
                                  className="inline-flex items-center gap-1 rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700"
                                >
                                  {slot.day} {slot.startTime}–{slot.endTime}
                                </span>
                              ))}
                            </div>
                          )}
                          {batch.startDate && (
                            <p className="mt-2 text-sm text-gray-500">
                              Starts: {formatDate(batch.startDate)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="text-xl font-bold text-brand-700">
                            {formatCurrency(batch.feePerMonth ?? 0)}/month
                          </span>
                          <Link
                            to={`/parent/checkout?teacherId=${teacher._id}&batchIndex=${idx}&duration=3months`}
                            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
                          >
                            {t('bookNow')}
                            <span aria-hidden>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {reviews.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-800">
                  <span className="text-xl">💬</span> Reviews ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((r, idx) => (
                    <div
                      key={idx}
                      className="animate-slide-up rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <StarRating rating={r.rating} />
                        <span className="text-sm text-gray-500">
                          {r.parentName} • {r.createdAt ? formatDate(r.createdAt) : ''}
                        </span>
                      </div>
                      {r.review && <p className="text-gray-700">{r.review}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="sticky top-4 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50/50 p-6 shadow-lg">
              <h3 className="mb-4 font-bold text-brand-800">Quick Summary</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="font-medium text-gray-600">Name:</span> {teacher.name || '—'}
                </li>
                <li>
                  <span className="font-medium text-gray-600">Experience:</span>{' '}
                  {formatExperience(teacher.experienceMonths)}
                </li>
                {hasRating && (
                  <li className="flex items-center gap-2">
                    <StarRating rating={teacher.averageRating!} />
                    <span>{teacher.averageRating?.toFixed(1)} ({teacher.reviewCount} reviews)</span>
                  </li>
                )}
                {batches.length > 0 && (
                  <li>
                    <span className="font-medium text-gray-600">Batches:</span>{' '}
                    {batches.length} available
                  </li>
                )}
                {badges.length > 0 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setBadgeModalOpen(true)}
                      className="inline-flex items-center gap-2 font-medium text-brand-700 hover:text-brand-800 hover:underline"
                    >
                      {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
                      <span className="text-xs">→</span>
                    </button>
                  </li>
                )}
              </ul>
              {batches.length > 0 && (
                <Link
                  to={`/parent/checkout?teacherId=${teacher._id}&batchIndex=0&duration=3months`}
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-2"
                >
                  {t('bookNow')}
                  <span aria-hidden>→</span>
                </Link>
              )}
            </div>

            {teacher.demoVideoUrl && (
              <div className="rounded-2xl border-2 border-brand-200 bg-white p-4 shadow-lg">
                <h3 className="mb-3 font-bold text-brand-800">{t('demoVideo')}</h3>
                <a
                  href={teacher.demoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-600 hover:underline"
                >
                  Watch demo →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <TeacherBadgeModal
        isOpen={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
        teacherName={teacher.name || 'Teacher'}
        badges={badges}
      />
    </div>
  );
}
