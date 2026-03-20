import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { apiJson } from '@/lib/api';

interface CmsPageViewProps {
  slug: string;
  /** Links to show at bottom (e.g. related pages) */
  links?: { to: string; label: string }[];
}

export function CmsPageView({ slug, links = [] }: CmsPageViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiJson<{ title: string; content: string }>(`/api/cms-pages/${slug}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'))
      .finally(() => setLoading(false));
  }, [slug]);

  const cardClass =
    'rounded-2xl border-2 border-brand-200/80 bg-white/95 shadow-lg shadow-brand-200/20 backdrop-blur-sm';

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="p-8 sm:p-10">
          <div className="animate-pulse rounded-lg bg-brand-100 px-4 py-3 font-medium text-brand-800">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className={cardClass}>
        <div className="p-8 sm:p-10">
          <p className="text-red-600">{error || 'Page not found'}</p>
          <p className="mt-4">
            <Link to="/" className="text-brand-600 hover:underline">Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  const sanitized = DOMPurify.sanitize(page.content, {
    ADD_ATTR: ['target', 'rel', 'allow', 'allowfullscreen', 'frameborder'],
    ADD_TAGS: ['iframe'],
  });

  return (
    <div className={cardClass}>
      <div className="p-8 sm:p-10 lg:p-12">
        <h1 className="mb-6 text-2xl font-bold text-brand-800 sm:text-3xl">{page.title}</h1>
        <div
          className="cms-content prose max-w-none prose-headings:text-brand-800 prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100 hover:border-brand-300"
          >
            ← Back to Home
          </Link>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:border-gray-300"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
