import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

const PAGE_TYPES = [
  { id: 'landing-sections', label: 'Landing Page Sections' },
  { id: 'for-you', label: 'For You Page' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'careers', label: 'Careers' },
  { id: 'role-config', label: 'Role Config' },
];

const LOCALES = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { id: 'bn', label: 'Bengali', flag: '🇮🇳' },
  { id: 'te', label: 'Telugu', flag: '🇮🇳' },
  { id: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { id: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { id: 'gu', label: 'Gujarati', flag: '🇮🇳' },
  { id: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { id: 'ml', label: 'Malayalam', flag: '🇮🇳' },
  { id: 'pa', label: 'Punjabi', flag: '🇮🇳' },
];

export default function WebsitePageContentEditor() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPage, setSelectedPage] = useState(PAGE_TYPES[0].id);
  const [selectedLang, setSelectedLang] = useState('en');
  const [jsonValue, setJsonValue] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.websitePageContent.get(selectedPage, selectedLang);
      setJsonValue(JSON.stringify(data.sections, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPage, selectedLang]);

  const handleSave = async () => {
    try {
      const sections = JSON.parse(jsonValue);
      setSaving(true);
      await adminApi.websitePageContent.update(selectedPage, selectedLang, sections);
      toast.success(`Successfully updated ${selectedPage} (${selectedLang})`);
    } catch (e) {
      if (e instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      } else {
        toast.error(e instanceof Error ? e.message : 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Website Page Content</h1>
          <p className="mt-1 text-sm text-accent-700">
            Edit structural content and sections for different pages and languages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="rounded-lg bg-accent-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <label className="mb-2 block text-sm font-medium text-accent-700">Page Type</label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="w-full rounded-lg border border-accent-200 bg-white px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
          >
            {PAGE_TYPES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-accent-200 pb-2">
        {LOCALES.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLang(l.id)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              selectedLang === l.id
                ? 'bg-accent-100 text-accent-800'
                : 'text-accent-600 hover:bg-accent-50 hover:text-accent-700'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <DataState loading={loading} error={error}>
        <div className="relative">
          <textarea
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            className="h-[600px] w-full font-mono text-sm leading-relaxed rounded-lg border border-accent-200 p-4 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
            spellCheck={false}
          />
          <div className="absolute top-2 right-2 space-x-2">
            <button
              onClick={() => {
                try {
                  setJsonValue(JSON.stringify(JSON.parse(jsonValue), null, 2));
                  toast.success('Formatted!');
                } catch {
                  toast.error('Invalid JSON');
                }
              }}
              className="rounded bg-accent-50 px-2 py-1 text-xs text-accent-600 hover:bg-accent-100"
            >
              Format JSON
            </button>
          </div>
        </div>
      </DataState>
    </div>
  );
}
