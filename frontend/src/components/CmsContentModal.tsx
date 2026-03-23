import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Modal } from '@/components/Modal';
import { apiJson } from '@/lib/api';

interface CmsContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  titleFallback?: string;
}

/**
 * Loads CMS page HTML by slug and shows in a modal (same content as full static pages).
 */
export function CmsContentModal({ isOpen, onClose, slug, titleFallback = 'Terms' }: CmsContentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setPage(null);
    apiJson<{ title: string; content: string }>(`/api/cms-pages/${slug}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isOpen, slug]);

  const sanitized =
    page?.content &&
    DOMPurify.sanitize(page.content, {
      ADD_ATTR: ['target', 'rel', 'allow', 'allowfullscreen', 'frameborder'],
      ADD_TAGS: ['iframe'],
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[min(88vh,720px)] w-full flex-col overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-5 py-4 sm:px-6">
          <h2 className="pr-4 text-lg font-bold text-white">
            {page?.title || titleFallback}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-3/4 rounded bg-brand-100" />
              <div className="h-4 w-full rounded bg-brand-50" />
              <div className="h-4 w-5/6 rounded bg-brand-50" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && sanitized && (
            <div
              className="cms-content prose prose-sm max-w-none prose-headings:text-brand-900 prose-p:text-gray-700 prose-a:text-brand-600 sm:prose-base"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          )}
        </div>
        <div className="shrink-0 border-t border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
