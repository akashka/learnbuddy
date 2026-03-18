import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function CmsPageEditor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    adminApi.cmsPages
      .get(slug)
      .then((p) => {
        setTitle(p.title);
        setContent(p.content || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.cmsPages.update(slug, { title, content });
      toast.success('Page saved successfully');
      navigate('/cms-pages');
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded bg-accent-100 font-medium text-accent-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-800">Edit: {slug}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-accent-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
            placeholder="Page title"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-accent-700">Content</label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Add text, images, videos, links..."
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  );
}
