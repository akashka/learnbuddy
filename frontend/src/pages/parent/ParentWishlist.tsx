import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import TeacherMarketplaceCard, { type TeacherMarketplaceProfile } from '@/components/TeacherMarketplaceCard';
import { useWishlist } from '@/hooks/useWishlist';

interface MarketplaceResponse {
  teachers: TeacherMarketplaceProfile[];
  total: number;
}

export default function ParentWishlist() {
  const [teachers, setTeachers] = useState<TeacherMarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [removeModalTeacher, setRemoveModalTeacher] = useState<TeacherMarketplaceProfile | null>(null);
  const [removing, setRemoving] = useState(false);
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

  if (error)
    return (
      <InlineErrorDisplay
        error={error}
        onRetry={() => {
          fetchWishlist();
          fetchTeachers();
        }}
        fullPage
      />
    );

  return (
    <div className="-mx-4 flex min-h-[calc(100vh-8rem)] flex-col sm:-mx-6 lg:-mx-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <PageHeader
          icon="❤️"
          title="My Wishlist"
          subtitle={
            teachers.length > 0
              ? `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} saved for later`
              : 'Teachers you want to connect with'
          }
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-sm font-medium text-gray-500">Loading your wishlist...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-10 text-center shadow-sm ring-1 ring-gray-900/5 sm:p-14">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-gray-200/80">
              ❤️
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Your wishlist is empty</h3>
            <p className="mb-6 text-sm text-gray-600">
              Browse the marketplace and add teachers you like to your wishlist. They&apos;ll appear here for easy access.
            </p>
            <Link
              to="/parent/marketplace"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-md"
            >
              Browse Teachers
              <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:gap-7 pt-1">
            {teachers.map((teacher, idx) => (
              <TeacherMarketplaceCard
                key={teacher._id}
                teacher={teacher}
                index={idx}
                isInWishlist
                onWishlistToggle={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRemoveModalTeacher(teacher);
                }}
              />
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
                Remove {removeModalTeacher?.name || 'this teacher'} from your wishlist? You can add them back anytime from
                the marketplace.
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
    </div>
  );
}
