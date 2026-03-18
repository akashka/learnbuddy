import { useState, useCallback, useMemo } from 'react';

export function useBulkSelect<T extends { _id: string }>(
  items: T[],
  options?: { selectable?: (item: T) => boolean }
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectableIds = useMemo(
    () =>
      options?.selectable
        ? items.filter(options.selectable).map((i) => i._id)
        : items.map((i) => i._id),
    [items, options?.selectable]
  );

  const toggle = useCallback(
    (id: string) => {
      if (options?.selectable && !selectableIds.includes(id)) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [selectableIds]
  );

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelectableSelected =
        selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      return allSelectableSelected ? new Set() : new Set(selectableIds);
    });
  }, [selectableIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isSelectable = useCallback(
    (id: string) => selectableIds.length === 0 || selectableIds.includes(id),
    [selectableIds]
  );

  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggle,
    toggleAll,
    clearSelection,
    isSelected,
    isSelectable,
    allSelectableSelected,
    someSelected,
  };
}
