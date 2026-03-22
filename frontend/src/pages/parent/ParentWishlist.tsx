import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { TeacherBadgeModal, type BadgeItem } from '@/components/TeacherBadgeModal';
import { useWishlist } from '@/hooks/useWishlist';
import { formatCurrency } from '@shared/formatters';

interface Teacher {
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
  documents?: { name?: string; verified?: boolean }[];
}

interface MarketplaceResponse {
  teachers: Teacher[];
  total: number;
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
        <span key={`e-${i}`} className="text-gray-300">★</span>
      ))}
    </span>
  );
}

export default function ParentWishlist() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [removeModalTeacher, setRemoveModalTeacher] = useState<Teacher | null>(null);
  const [removing, setRemoving] = useState(false);
  const [badgeModalTeacher, setBadgeModalTeacher] = useState<Teacher | null>(null);
  const { teacherIds, removeFromWishlist, fetchWishlist } = useWishlist();

  const fetchTeachers = useCallback(async () => {
    if (teacherIds.length === 0) {
      setTeachers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ids = teacherIds.join(',');
      const res = await apiJson<MarketplaceResponse>(`/api/teachers/marketplace?ids=${encodeURIComponent(ids)}&limit=100`);
      setTeachers(res.teachers || []);
    } catch (e) {
      setError(e instanceof Error ? e : String(e));
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [teacherIds]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleRemoveConfirm = async () => {
    if (!removeModalTeacher) return;
    setRemoving(true);
    try {
      await removeFromWishlist(removeModalTeacher._id);
      setRemoveModalTeacher(null);
    } finally {
      setRemoving(false);
    }
  };

  if (error) return <InlineErrorDisplay error={error} onRetry={() => { fetchWishlist(); fetchTeachers(); }} fullPage />;

  return (
    <div className="-mx-4 flex min-h-[calc(100vh-8rem)] flex-col sm:-mx-6 lg:-mx-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <PageHeader
          icon="❤️"
          title="My Wishlist"
          subtitle={teachers.length > 0 ? `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} saved for later` : 'Teachers you want to connect with'}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-sm font-medium text-gray-500">Loading your wishlist...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white via-brand-50/30 to-accent-50/30 p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-5xl">❤️</div>
            <h3 className="mb-2 text-xl font-bold text-brand-800">Your wishlist is empty</h3>
            <p className="mb-6 text-gray-600">
              Browse the marketplace and add teachers you like to your wishlist. They&apos;ll appear here for easy access.
            </p>
            <Link
              to="/parent/marketplace"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              Browse Teachers
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {teachers.map((teacher, idx) => (
              <div
                key={teacher._id}
                className="group card-funky animate-slide-up relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-white via-brand-50/30 to-accent-50/30 p-6 shadow-lg transition-all duration-300 hover:border-brand-300 hover:shadow-xl"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <button
                  type="button"
                  onClick={() => setRemoveModalTeacher(teacher)}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md ring-1 ring-black/5 transition-all hover:scale-110 hover:bg-rose-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <svg className="h-5 w-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </button>

                <Link to={`/parent/teacher/${teacher._id}`} className="relative z-0 flex flex-1 flex-col">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent-200/20 blur-xl" />
                  <div className="relative flex flex-1 flex-col">
                    <div className="mb-4 flex items-start gap-4">
                      <div className="relative shrink-0">
                        <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-brand-100">
                          {teacher.photoUrl ? (
                            <img
                              src={teacher.photoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200 text-3xl">
                              👩‍🏫
                            </div>
                          )}
                        </div>
                        {getTeacherBadges(teacher).length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setBadgeModalTeacher(teacher);
                            }}
                            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white shadow-md transition hover:bg-green-600"
                            title="View badges"
                          >
                            {getTeacherBadges(teacher).length}
                          </button>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-brand-800">{teacher.name || 'Teacher'}</h3>
                        <dl className="mt-2 space-y-0.5 text-xs text-gray-600">
                          <div className="flex gap-3">
                            <span>Gender: {teacher.gender || '—'}</span>
                            <span>Age: {formatAge(teacher.dateOfBirth)}</span>
                          </div>
                          <div>Experience: {formatExperience(teacher.experienceMonths)}</div>
                        </dl>
                        {(teacher.board || teacher.classes || teacher.subjects) && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {[teacher.board, teacher.classes, teacher.subjects]
                              .flat()
                              .filter(Boolean)
                              .slice(0, 4)
                              .map((tag) => (
                                <span
                                  key={String(tag)}
                                  className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {teacher.averageRating != null && teacher.averageRating > 0 && (
                          <span className="flex items-center gap-1 font-medium text-amber-900">
                            <StarRating rating={teacher.averageRating} />
                            {teacher.averageRating.toFixed(1)} ({teacher.reviewCount || 0} reviews)
                          </span>
                        )}
                        {teacher.feeStartsFrom != null && teacher.feeStartsFrom > 0 && (
                          <span className="font-semibold text-brand-700">
                            {formatCurrency(teacher.feeStartsFrom)}/mo
                          </span>
                        )}
                        {teacher.bgvVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                            ✓ BGV
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all group-hover:bg-brand-700 group-hover:shadow-lg">
                        View Profile
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={!!removeModalTeacher}
        onClose={() => !removing && setRemoveModalTeacher(null)}
        overlayClassName="bg-black/50 backdrop-blur-sm"
        maxWidth="max-w-md"
      >
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white p-6 shadow-2xl ring-1 ring-black/5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-2xl">❤️</div>
            <div>
              <h3 className="text-lg font-semibold text-brand-800">Remove from wishlist</h3>
              <p className="text-sm text-gray-600">
                Remove {removeModalTeacher?.name || 'this teacher'} from your wishlist? You can add them back anytime from the marketplace.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRemoveModalTeacher(null)}
              disabled={removing}
              className="rounded-xl border-2 border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemoveConfirm}
              disabled={removing}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {removing ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </Modal>

      <TeacherBadgeModal
        isOpen={!!badgeModalTeacher}
        onClose={() => setBadgeModalTeacher(null)}
        teacherName={badgeModalTeacher?.name || 'Teacher'}
        badges={badgeModalTeacher ? getTeacherBadges(badgeModalTeacher) : []}
      />
    </div>
  );
}
