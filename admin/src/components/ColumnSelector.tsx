import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setColumnPreferences } from '@/lib/preferences';

type ColumnDef = { key: string; label: string };

export function ColumnSelector({
  pageKey,
  columns,
  visibleColumns,
  onVisibleChange,
}: {
  pageKey: string;
  columns: ColumnDef[];
  visibleColumns: string[];
  onVisibleChange: (visible: string[]) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Record<string, boolean>>(() => {
    const vis = new Set(visibleColumns);
    return Object.fromEntries(columns.map((c) => [c.key, vis.has(c.key)]));
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vis = new Set(visibleColumns);
    setLocal(Object.fromEntries(columns.map((c) => [c.key, vis.has(c.key)])));
  }, [visibleColumns, columns]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (key: string, checked: boolean) => {
    const next = { ...local, [key]: checked };
    setLocal(next);
    const visible = columns.filter((c) => next[c.key]).map((c) => c.key);
    onVisibleChange(visible);
    setColumnPreferences(pageKey, next, user?.id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-accent-200 px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
      >
        Columns ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-accent-200 bg-white py-2 shadow-lg">
          {columns.map((c) => (
            <label
              key={c.key}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent-50"
            >
              <input
                type="checkbox"
                checked={local[c.key] ?? true}
                onChange={(e) => handleToggle(c.key, e.target.checked)}
              />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
