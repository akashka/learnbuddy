import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { apiJson } from '@/lib/api';
import { PolicyModal } from './PolicyModal';

interface CmsContentInModalProps {
  slug: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CmsContentInModal({ slug, title, isOpen, onClose }: CmsContentInModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !slug) return;
    setLoading(true);
    setError(null);
    apiJson<{ title: string; content: string }>(`/api/cms-pages/${slug}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [slug, isOpen]);

  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title={title}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-4 text-brand-600">Loading...</p>
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : page ? (
        <div className="prose max-w-none">
          <div
            className="cms-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(page.content, {
                ADD_ATTR: ['target', 'rel', 'allow', 'allowfullscreen', 'frameborder'],
                ADD_TAGS: ['iframe'],
              }),
            }}
          />
        </div>
      ) : null}
    </PolicyModal>
  );
}
