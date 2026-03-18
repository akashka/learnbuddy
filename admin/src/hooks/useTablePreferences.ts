import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleColumns, setColumnPreferences } from '@/lib/preferences';

export function useTablePreferences(pageKey: string, allColumns: readonly string[]) {
  const { user } = useAuth();
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  useEffect(() => {
    setVisibleColumns(getVisibleColumns(pageKey, [...allColumns], user?.id));
  }, [pageKey, user?.id, allColumns.join(',')]);

  const setVisible = useCallback(
    (cols: string[]) => {
      setVisibleColumns(cols);
      const prefs = Object.fromEntries([...allColumns].map((c) => [c, cols.includes(c)]));
      setColumnPreferences(pageKey, prefs, user?.id);
    },
    [pageKey, user?.id, allColumns.join(',')]
  );

  return [visibleColumns, setVisible] as const;
}
