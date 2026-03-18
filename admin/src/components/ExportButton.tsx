import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

type FieldDef = { key: string; label: string };

interface ExportButtonProps {
  entity: string;
  fields: FieldDef[];
  label?: string;
  /** Query params to pass (e.g. search, filters) */
  params?: Record<string, string>;
}

export function ExportButton({ entity, fields, label = 'Download', params = {} }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, true]))
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    const chosen = fields.filter((f) => selected[f.key]).map((f) => f.key);
    if (chosen.length === 0) {
      setError('Select at least one field');
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ fields: chosen.join(',') });
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
      });
      const path = `/api/admin/${entity}/export?${sp.toString()}`;
      const res = await api(path);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Export failed');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] || `${entity}-export.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const toggleField = (key: string, checked: boolean) => {
    setSelected((s) => ({ ...s, [key]: checked }));
  };

  const selectAll = () => setSelected(Object.fromEntries(fields.map((f) => [f.key, true])));
  const selectNone = () => setSelected(Object.fromEntries(fields.map((f) => [f.key, false])));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setError(null); }}
        className="rounded-lg border border-accent-200 px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-accent-200 bg-white py-3 shadow-lg">
          <div className="mb-2 px-3 text-xs font-medium text-accent-600">Select fields to export</div>
          <div className="max-h-48 overflow-y-auto px-2">
            {fields.map((f) => (
              <label
                key={f.key}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent-50"
              >
                <input
                  type="checkbox"
                  checked={selected[f.key] ?? true}
                  onChange={(e) => toggleField(f.key, e.target.checked)}
                />
                {f.label}
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-1 px-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded px-2 py-1 text-xs text-accent-600 hover:bg-accent-100"
            >
              All
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="rounded px-2 py-1 text-xs text-accent-600 hover:bg-accent-100"
            >
              None
            </button>
          </div>
          {error && <div className="mt-2 px-3 text-xs text-red-600">{error}</div>}
          <div className="mt-2 border-t border-accent-100 px-2 pt-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="w-full rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
