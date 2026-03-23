import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

export type LearnerOption = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

/**
 * Loads all children for the logged-in parent (names + photos) for learner filter UIs.
 */
export function useParentLearnerOptions() {
  const [options, setOptions] = useState<LearnerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiJson<{ children: { _id: string; name?: string; photoUrl?: string; studentId?: string }[] }>('/api/parent/students')
      .then((r) => {
        if (cancelled) return;
        const list = (r.children || []).map((c) => ({
          id: String(c._id),
          name: c.name?.trim() || c.studentId || 'Learner',
          photoUrl: c.photoUrl,
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setOptions(list);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading };
}
