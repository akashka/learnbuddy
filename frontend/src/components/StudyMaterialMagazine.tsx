import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Section = { type?: string; heading?: string; content?: string; caption?: string };

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-4 text-2xl font-bold text-brand-800">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-3 mt-6 text-xl font-bold text-brand-700">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-brand-700">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-700">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-700">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-brand-800">{children}</strong>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-');
    return isBlock ? (
      <code className="block font-mono text-sm">{children}</code>
    ) : (
      <code className="rounded bg-brand-100 px-1.5 py-0.5 font-mono text-sm text-brand-800">{children}</code>
    );
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-brand-400 bg-brand-50/80 pl-4 py-2 my-3 italic text-gray-700">{children}</blockquote>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-brand-100">{children}</pre>
  ),
};

export default function StudyMaterialMagazine({
  sections,
  title,
}: {
  sections: Section[];
  title?: string;
}) {
  const textSections = sections.filter((s) => s.type === 'text' || !s.type);
  const SECTIONS_PER_PAGE = 2;
  const totalPages = Math.max(1, Math.ceil(textSections.length / SECTIONS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [isTurning, setIsTurning] = useState(false);

  const handlePrev = useCallback(() => {
    if (page <= 0) return;
    setIsTurning(true);
    setPage((p) => p - 1);
    setTimeout(() => setIsTurning(false), 400);
  }, [page]);

  const handleNext = useCallback(() => {
    if (page >= totalPages - 1) return;
    setIsTurning(true);
    setPage((p) => p + 1);
    setTimeout(() => setIsTurning(false), 400);
  }, [page, totalPages]);

  const startIdx = page * SECTIONS_PER_PAGE;
  const pageSections = textSections.slice(startIdx, startIdx + SECTIONS_PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl" style={{ perspective: '1200px' }}>
        <div className="bg-gradient-to-br from-stone-100 to-amber-50/50 px-6 py-4 border-b border-brand-100">
          <h2 className="text-xl font-bold text-brand-800">{title || 'Study Material'}</h2>
          <p className="text-sm text-gray-600">Page {page + 1} of {totalPages}</p>
        </div>

        <div
          className={`relative min-h-[320px] p-8 transition-all duration-400 ease-out ${
            isTurning ? 'opacity-90 scale-[0.98]' : 'opacity-100 scale-100'
          }`}
        >
          <div className="min-h-[280px] space-y-8">
            {pageSections.map((s, i) => (
              <div
                key={startIdx + i}
                className="rounded-xl border-l-4 border-brand-400 bg-gradient-to-r from-white to-brand-50/30 p-6 shadow-sm"
              >
                {s.heading && (
                  <h3 className="mb-3 text-lg font-semibold text-brand-800">{s.heading}</h3>
                )}
                <div className="prose prose-brand max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {s.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-brand-100 bg-stone-50/80 px-6 py-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="flex items-center gap-2 rounded-xl border-2 border-brand-300 bg-white px-5 py-2.5 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-sm font-medium text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            className="flex items-center gap-2 rounded-xl border-2 border-brand-300 bg-white px-5 py-2.5 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
