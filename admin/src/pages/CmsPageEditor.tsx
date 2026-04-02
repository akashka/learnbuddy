import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { RichTextEditor } from '@/components/RichTextEditor';

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

export default function CmsPageEditor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    adminApi.cmsPages
      .get(slug, selectedLang)
      .then((p) => {
        setTitle(p.title);
        setContent(p.content || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [slug, selectedLang]);

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.cmsPages.update(slug, { title, content }, selectedLang);
      toast.success(`Page (${selectedLang}) saved successfully`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!slug) {
    return (
      <div className="p-8">
        <p className="text-accent-600">Invalid page</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Edit: {slug}</h1>
          <p className="mt-1 text-sm text-accent-600">Manage content and translations for this page.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/cms-pages')}
            className="rounded-lg border border-accent-200 bg-white px-4 py-2 text-sm font-medium text-accent-700 transition hover:bg-accent-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-accent-200 pb-2">
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

      {loading ? (
        <div className="animate-pulse rounded bg-accent-50 p-12 text-center text-accent-400 font-medium">Loading content...</div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Page Title ({selectedLang})</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 placeholder:text-accent-300 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                placeholder="Enter page title..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Body Content ({selectedLang})</label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Add text, images, videos, links..."
                minHeight="500px"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
