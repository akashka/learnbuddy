import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { ExportButton } from '@/components/ExportButton';

type CmsPage = { slug: string; title: string; content: string; updatedAt: string };

function slugFromInput(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function CmsPages() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createSlug, setCreateSlug] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPages = () => {
    setLoading(true);
    adminApi.cmsPages
      .list()
      .then((d) => setPages(d.pages))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreate = async () => {
    const slug = slugFromInput(createSlug || createTitle);
    const title = createTitle.trim() || createSlug.trim();
    if (!slug) {
      setCreateError('Enter a slug or title');
      return;
    }
    if (pages.some((p) => p.slug === slug)) {
      setCreateError(`Page "${slug}" already exists. Use Edit to modify it.`);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await adminApi.cmsPages.update(slug, { title: title || slug, content: '' });
      setShowCreate(false);
      setCreateSlug('');
      setCreateTitle('');
      toast.success('Page created');
      fetchPages();
      navigate(`/cms-pages/${slug}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create page';
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">CMS Pages</h1>
          <p className="mt-1 text-sm text-accent-700">
            Edit static pages (About Us, Contact Us, Privacy Policy, etc.) shown on the frontend, app, and website.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            entity="cms-pages"
            fields={[
              { key: 'slug', label: 'Slug' },
              { key: 'title', label: 'Title' },
              { key: 'content', label: 'Content' },
              { key: 'updatedAt', label: 'Updated' },
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setShowCreate(true);
              setCreateError(null);
              setCreateSlug('');
              setCreateTitle('');
            }}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700"
          >
            Create page
          </button>
        </div>
      </div>

      <DataState loading={loading} error={error}>
        {pages.length > 0 && (
          <div className="space-y-2">
            {pages.map((p) => (
              <Link
                key={p.slug}
                to={`/cms-pages/${p.slug}`}
                className="flex items-center justify-between rounded-lg border border-accent-200 bg-white p-4 transition hover:bg-accent-50"
              >
                <div>
                  <span className="font-medium text-accent-800">{p.title}</span>
                  <span className="ml-2 text-sm text-accent-600">/{p.slug}</span>
                </div>
                <span className="text-sm text-accent-600">
                  Updated {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}
                </span>
              </Link>
            ))}
          </div>
        )}
        {!loading && !error && pages.length === 0 && (
          <p className="text-accent-600">No CMS pages found. Create one.</p>
        )}
      </DataState>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !creating && setShowCreate(false)}>
          <div
            className="w-full max-w-md rounded-xl border border-accent-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-accent-800">Create CMS Page</h2>
            {createError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => {
                    setCreateTitle(e.target.value);
                    if (!createSlug) setCreateSlug(slugFromInput(e.target.value));
                  }}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  placeholder="e.g. About Us"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Slug (URL path)</label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(slugFromInput(e.target.value))}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  placeholder="e.g. about-us"
                />
                <p className="mt-1 text-xs text-accent-500">Lowercase, hyphens only. Used in URL: /page/{'{slug}'}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !creating && setShowCreate(false)}
                className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
