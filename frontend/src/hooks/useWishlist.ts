import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiJson } from '@/lib/api';

interface WishlistResponse {
  teacherIds: string[];
}

export function useWishlist() {
  const [teacherIds, setTeacherIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await apiJson<WishlistResponse>('/api/parent/wishlist');
      setTeacherIds(new Set(res.teacherIds || []));
    } catch {
      setTeacherIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(
    async (teacherId: string) => {
      await apiJson('/api/parent/wishlist', {
        method: 'POST',
        body: JSON.stringify({ teacherId }),
      });
      setTeacherIds((prev) => new Set([...prev, teacherId]));
    },
    []
  );

  const removeFromWishlist = useCallback(async (teacherId: string) => {
    await apiJson(`/api/parent/wishlist?teacherId=${encodeURIComponent(teacherId)}`, {
      method: 'DELETE',
    });
    setTeacherIds((prev) => {
      const next = new Set(prev);
      next.delete(teacherId);
      return next;
    });
  }, []);

  const isInWishlist = useCallback(
    (teacherId: string) => teacherIds.has(teacherId),
    [teacherIds]
  );

  /** Stable array identity when Set contents are unchanged — avoids infinite loops in consumers that depend on `teacherIds` (e.g. marketplace fetch in ParentWishlist). */
  const teacherIdsArray = useMemo(() => Array.from(teacherIds), [teacherIds]);

  return {
    teacherIds: teacherIdsArray,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    fetchWishlist,
    loading,
  };
}
