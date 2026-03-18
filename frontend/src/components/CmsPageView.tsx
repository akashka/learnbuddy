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

  if (loading) {
    return (
      <div className="prose max-w-none">
        <div className="animate-pulse rounded bg-brand-100 font-medium text-brand-800">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="prose max-w-none">
        <p className="text-red-600">{error || 'Page not found'}</p>
        <p>
          <Link to="/" className="text-brand-600 hover:underline">Back to Home</Link>
        </p>
      </div>
    );
  }

  const sanitized = DOMPurify.sanitize(page.content, {
    ADD_ATTR: ['target', 'rel', 'allow', 'allowfullscreen', 'frameborder'],
    ADD_TAGS: ['iframe'],
  });

  return (
    <div className="prose prose max-w-none">
      <h1 className="text-2xl font-bold text-brand-800">{page.title}</h1>
      <div
        className="cms-content"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      <p className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link to="/" className="text-brand-600 hover:underline">Back to Home</Link>
        {links.map((l) => (
          <span key={l.to}>
            {' • '}
            <Link to={l.to} className="text-brand-600 hover:underline">{l.label}</Link>
          </span>
        ))}
      </p>
    </div>
  );
}
