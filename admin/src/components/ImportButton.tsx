import { useState, useRef, useEffect } from 'react';
import { api, apiJson } from '@/lib/api';

interface ImportButtonProps {
  entity: string;
  templateFilename?: string;
  label?: string;
  onSuccess?: (result: { created: number; skipped: string[]; errors: string[] }) => void;
}

export function ImportButton({
  entity,
  templateFilename = 'template',
  label = 'Import',
  onSuccess,
}: ImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: string[]; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = (e.target as HTMLElement).closest('button');
        if (!btn?.textContent?.includes('Import')) setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError(null);
    try {
      const path = `/api/admin/${entity}/template`;
      const res = await api(path);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = (errData as { error?: string }).error || `Failed to download template (${res.status})`;
        throw new Error(msg);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] || `${entity}-${templateFilename}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await apiJson<{ created: number; skipped: string[]; errors: string[] }>(
        `/api/admin/${entity}/import`,
        {
          method: 'POST',
          body: JSON.stringify({ csv: text }),
        }
      );
      setResult(res);
      onSuccess?.(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setError(null); setResult(null); }}
        className="rounded-lg border border-accent-200 px-3 py-2 text-sm text-accent-700 hover:bg-accent-50"
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[260px] rounded-lg border border-accent-200 bg-white p-4 shadow-lg">
          <p className="mb-3 text-sm text-accent-700">
            Download the template, fill it, then upload.
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50 disabled:opacity-50"
            >
              {downloading ? 'Downloading...' : '1. Download template'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : '2. Upload filled file'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          {result && (
            <div className="mt-6 space-y-1 text-sm">
              <p className="font-medium text-green-700">Created: {result.created}</p>
              {result.skipped.length > 0 && (
                <p className="text-amber-700">Skipped: {result.skipped.join(', ')}</p>
              )}
              {result.errors.length > 0 && (
                <p className="text-red-600">Errors: {result.errors.join('; ')}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
