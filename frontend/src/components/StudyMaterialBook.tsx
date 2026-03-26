import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Section = { type?: string; heading?: string; content?: string; caption?: string };

type BookPage = { heading?: string; content: string; isContinuation?: boolean };

const CHARS_PER_PAGE = 900;
const MIN_PARAGRAPHS_PER_PAGE = 1;
const MAX_PARAGRAPHS_PER_PAGE = 4;
const DRAG_THRESHOLD = 80;

function splitLongParagraph(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      chunks.push(rest);
      break;
    }
    const slice = rest.slice(0, maxLen);
    const lastSpace = slice.lastIndexOf(' ');
    const breakAt = lastSpace > maxLen * 0.5 ? lastSpace : maxLen;
    chunks.push(rest.slice(0, breakAt).trim());
    rest = rest.slice(breakAt).trim();
  }
  return chunks;
}

function buildPagesFromSections(sections: Section[]): BookPage[] {
  const textSections = sections.filter((s) => s.type === 'text' || !s.type);
  const pages: BookPage[] = [];

  for (const section of textSections) {
    const heading = section.heading?.trim() || '';
    const content = (section.content || '').trim();
    if (!content && !heading) continue;

    const rawParagraphs = content.split(/\n\n+/).filter(Boolean);
    const paragraphs: string[] = [];
    for (const p of rawParagraphs) {
      if (p.length > CHARS_PER_PAGE) {
        paragraphs.push(...splitLongParagraph(p, CHARS_PER_PAGE));
      } else {
        paragraphs.push(p);
      }
    }

    if (paragraphs.length === 0 && heading) {
      pages.push({ heading, content: '', isContinuation: false });
      continue;
    }
    if (paragraphs.length === 0) continue;

    let currentChunk: string[] = [];
    let currentLen = 0;
    let isFirstPageOfTopic = true;

    for (const para of paragraphs) {
      const paraLen = para.length + 2;
      if (currentChunk.length >= MAX_PARAGRAPHS_PER_PAGE || (currentLen + paraLen > CHARS_PER_PAGE && currentChunk.length >= MIN_PARAGRAPHS_PER_PAGE)) {
        pages.push({
          heading: isFirstPageOfTopic ? heading : undefined,
          content: currentChunk.join('\n\n'),
          isContinuation: !isFirstPageOfTopic,
        });
        isFirstPageOfTopic = false;
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(para);
      currentLen += paraLen;
    }
    if (currentChunk.length > 0) {
      pages.push({
        heading: isFirstPageOfTopic ? heading : undefined,
        content: currentChunk.join('\n\n'),
        isContinuation: !isFirstPageOfTopic,
      });
    }
  }

  return pages.length > 0 ? pages : [{ content: 'No content.', isContinuation: false }];
}

const TEXT_SIZES = [
  { base: 'text-[13px]', h1: 'text-lg', h2: 'text-base', h3: 'text-sm', label: 'Small' },
  { base: 'text-[15px]', h1: 'text-xl', h2: 'text-lg', h3: 'text-base', label: 'Medium' },
  { base: 'text-[17px]', h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg', label: 'Large' },
];

function getMarkdownComponents(sizeIdx: number) {
  const s = TEXT_SIZES[Math.min(sizeIdx, 2)];
  return {
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className={`mb-3 font-bold text-brand-800 ${s.h1}`}>{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className={`mb-2 mt-4 font-bold text-brand-700 ${s.h2}`}>{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className={`mb-2 mt-3 font-semibold text-brand-700 ${s.h3}`}>{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className={`mb-2 text-gray-700 leading-relaxed ${s.base}`}>{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className={`mb-3 ml-5 list-disc space-y-0.5 text-gray-700 ${s.base}`}>{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className={`mb-3 ml-5 list-decimal space-y-0.5 text-gray-700 ${s.base}`}>{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-brand-800">{children}</strong>,
    code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
      const isBlock = className?.includes('language-');
      return isBlock ? <code className="block font-mono text-sm">{children}</code> : <code className="rounded bg-brand-100 px-1 py-0.5 font-mono text-sm text-brand-800">{children}</code>;
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className={`border-l-4 border-brand-400 bg-brand-50/80 pl-3 py-1.5 my-2 italic text-gray-700 ${s.base}`}>{children}</blockquote>,
    pre: ({ children }: { children?: React.ReactNode }) => <pre className="mb-3 overflow-x-auto rounded-lg bg-gray-900 p-3 text-brand-100 text-sm">{children}</pre>,
  };
}

function PageContent({ page, pageNum, sizeIdx }: { page: BookPage; pageNum: number; sizeIdx: number }) {
  const components = useMemo(() => getMarkdownComponents(sizeIdx), [sizeIdx]);
  return (
    <div className="h-full min-h-0 overflow-y-auto flex flex-col p-4">
      <p className="mb-2 text-xs font-medium text-amber-700/70">{pageNum}</p>
      {page.heading && (
        <h3 className={`mb-3 font-semibold text-brand-800 ${TEXT_SIZES[Math.min(sizeIdx, 2)].h3}`}>{page.heading}</h3>
      )}
      <div className="prose prose-brand max-w-none text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {page.content || ''}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function StudyMaterialBook({
  sections,
  title,
  onCurrentPageTextChange,
}: {
  sections: Section[];
  title?: string;
  /** Called when the visible page(s) change. Use for read-aloud of current spread only. */
  onCurrentPageTextChange?: (text: string) => void;
}) {
  const pages = useMemo(() => buildPagesFromSections(sections), [sections]);
  const totalPages = pages.length;
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [spread, setSpread] = useState(0); // 0 = pages 0,1; 1 = pages 2,3; etc.
  const [isFlipping, setIsFlipping] = useState(false);

  const [dragState, setDragState] = useState<{ startX: number; currentX: number } | null>(null);
  const [textSizeIdx, setTextSizeIdx] = useState(1); // 0=small, 1=medium, 2=large
  const [flipCompleting, setFlipCompleting] = useState<'next' | 'prev' | null>(null);

  const totalSpreads = Math.ceil(totalPages / 2);
  const leftPageIdx = spread * 2;
  const rightPageIdx = spread * 2 + 1;
  const leftPage = leftPageIdx < totalPages ? pages[leftPageIdx] : null;
  const rightPage = rightPageIdx < totalPages ? pages[rightPageIdx] : null;

  const currentSpreadText = useMemo(() => {
    const parts: string[] = [];
    if (leftPage) {
      if (leftPage.heading) parts.push(leftPage.heading);
      if (leftPage.content) parts.push(leftPage.content);
    }
    if (rightPage) {
      if (rightPage?.heading) parts.push(rightPage.heading);
      if (rightPage?.content) parts.push(rightPage.content);
    }
    return parts.filter(Boolean).join('. ');
  }, [leftPage, rightPage]);

  useEffect(() => {
    onCurrentPageTextChange?.(isOpen ? currentSpreadText : title || '');
  }, [isOpen, currentSpreadText, title, onCurrentPageTextChange]);

  const handleOpenBook = useCallback(() => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
      setIsOpen(true);
    }, 700);
  }, []);

  const goPrev = useCallback(() => {
    if (spread <= 0) return;
    setIsFlipping(true);
    setTimeout(() => {
      setSpread((s) => s - 1);
      setIsFlipping(false);
    }, 400);
  }, [spread]);

  const goNext = useCallback(() => {
    if (spread >= totalSpreads - 1) return;
    setIsFlipping(true);
    setTimeout(() => {
      setSpread((s) => s + 1);
      setIsFlipping(false);
    }, 400);
  }, [spread, totalSpreads]);

  const getClientX = useCallback((e: MouseEvent | TouchEvent) => {
    return 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isFlipping || flipCompleting) return;
      const x = getClientX(e.nativeEvent);
      setDragState({ startX: x, currentX: x });
    },
    [isFlipping, flipCompleting, getClientX]
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState) return;
      const x = getClientX(e);
      setDragState((d) => (d ? { ...d, currentX: x } : null));
    },
    [dragState, getClientX]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragState) return;
    const delta = dragState.startX - dragState.currentX;
    if (delta > DRAG_THRESHOLD) {
      setFlipCompleting('next');
      setTimeout(() => {
        goNext();
        setFlipCompleting(null);
        setDragState(null);
      }, 280);
    } else if (delta < -DRAG_THRESHOLD) {
      setFlipCompleting('prev');
      setTimeout(() => {
        goPrev();
        setFlipCompleting(null);
        setDragState(null);
      }, 280);
    } else {
      setDragState(null);
    }
  }, [dragState, goNext, goPrev]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  const dragDelta = dragState ? dragState.startX - dragState.currentX : 0;
  const isCompleting = flipCompleting !== null;
  const completingDeg = flipCompleting === 'next' ? 180 : flipCompleting === 'prev' ? -180 : 0;
  const flipDeg = isCompleting
    ? completingDeg
    : Math.max(-180, Math.min(180, (dragDelta / 100) * 110));
  const isFlippingRight = dragDelta > 0 || flipCompleting === 'next';
  const isFlippingLeft = dragDelta < 0 || flipCompleting === 'prev';
  const showFlipOverlay = (dragState && (isFlippingRight || isFlippingLeft) && Math.abs(flipDeg) > 2) || isCompleting;

  const hasPrev = spread > 0;
  const hasNext = spread < totalSpreads - 1;

  if (!isOpen) {
    return (
      <div className="flex min-h-[380px] items-center justify-center" style={{ perspective: '1400px' }}>
        <div
          className={`relative w-full max-w-md ${isOpening ? 'animate-book-cover-open' : ''}`}
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
        >
          <div
            className="h-full min-h-[340px] w-full rounded-r-xl rounded-l-sm border-4 border-amber-800/40 bg-gradient-to-br from-amber-100 via-amber-50 to-stone-100 shadow-2xl"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.08), 10px 6px 24px rgba(120,80,40,0.22)' }}
          >
            <div className="flex h-full min-h-[340px] w-full flex-col items-center justify-center p-8">
              <div className="mb-4 text-5xl opacity-90" aria-hidden>📖</div>
              <h2 className="text-center text-xl font-bold text-brand-800">{title || 'Study Material'}</h2>
              <p className="mt-2 text-center text-xs text-amber-800/80">Tap to open and start reading</p>
              <button
                type="button"
                onClick={handleOpenBook}
                disabled={isOpening}
                className="mt-6 rounded-lg bg-gradient-to-r from-brand-500 to-violet-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:from-brand-600 hover:to-violet-700 disabled:opacity-70"
              >
                Open Book
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center" style={{ perspective: '2000px' }}>
      <div ref={containerRef} className="relative w-full" style={{ maxWidth: 'min(100%, 80rem)' }}>
        {/* Book area - drag to flip (only on the book pages) */}
        <div
          className={`relative select-none ${dragState ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
        >
          {/* 3D book shadow - cast on surface */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[90%] h-8 -bottom-6 rounded-full opacity-25 blur-xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(60,40,20,0.5) 0%, transparent 70%)', transform: 'translateZ(-20px)' }}
          />
          <div
            className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl -z-10"
            style={{ background: 'radial-gradient(ellipse at center, rgba(120,80,40,0.5) 0%, transparent 70%)' }}
          />

        {/* Book container - two-page spread with 3D page look */}
        <div
          className="relative flex overflow-hidden"
          style={{
            height: '620px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15), 0 8px 20px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(180,140,80,0.25), inset 2px 0 4px rgba(255,255,255,0.8), inset -2px 0 4px rgba(0,0,0,0.04)',
            background: 'linear-gradient(145deg, #e8e2d5 0%, #faf5eb 25%, #fef9f0 50%, #faf5eb 75%, #e8e2d5 100%)',
            borderRadius: '6px',
            border: '1px solid rgba(210,180,140,0.6)',
            transform: 'rotateX(2deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Left page - book page edge */}
          <div
            className="relative flex-1 overflow-hidden h-full"
            style={{
              background: 'linear-gradient(90deg, #fefcf5 0%, #fffbeb 25%, #fef9c3 100%)',
              boxShadow: 'inset 6px 0 20px rgba(0,0,0,0.06), 3px 0 8px rgba(0,0,0,0.04)',
              borderRight: '1px solid rgba(210,180,140,0.5)',
            }}
          >
            {leftPage ? (
              <div
                className="h-full min-h-0 flex flex-col overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,249,195,0.25) 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  marginRight: '2px',
                  borderRight: '1px solid rgba(230,210,170,0.6)',
                }}
              >
                <PageContent page={leftPage} pageNum={leftPageIdx + 1} sizeIdx={textSizeIdx} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-amber-600/30 text-sm">Blank</div>
            )}
          </div>

          {/* Center gutter / 3D spine */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.15), rgba(0,0,0,0.05))',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.12), 1px 0 2px rgba(255,255,255,0.3)',
            }}
          />

          {/* Right page - with flip overlay when dragging */}
          <div
            className="relative flex-1 overflow-hidden h-full"
            style={{
              background: 'linear-gradient(270deg, #fef9c3 0%, #fffbeb 75%, #fefcf5 100%)',
              boxShadow: 'inset -6px 0 20px rgba(0,0,0,0.06), -3px 0 8px rgba(0,0,0,0.04)',
              borderLeft: '1px solid rgba(210,180,140,0.4)',
            }}
          >
            {/* Flipping page overlay - smooth rotation as you drag */}
            {showFlipOverlay && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '2400px',
                  willChange: 'transform',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `rotateY(${-flipDeg}deg)`,
                    transformOrigin: isFlippingRight ? 'left center' : 'right center',
                    backfaceVisibility: 'hidden',
                    transition: isCompleting ? 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                    background: 'linear-gradient(90deg, #fef9c3 0%, #fffbeb 100%)',
                    boxShadow: isFlippingRight
                      ? '12px 0 32px rgba(0,0,0,0.18), 4px 0 8px rgba(0,0,0,0.08)'
                      : '-12px 0 32px rgba(0,0,0,0.18), -4px 0 8px rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="h-full p-4 overflow-hidden">
                    {isFlippingRight && hasNext && pages[spread * 2 + 2] && (
                      <PageContent page={pages[spread * 2 + 2]} pageNum={spread * 2 + 3} sizeIdx={textSizeIdx} />
                    )}
                    {isFlippingLeft && hasPrev && pages[spread * 2 - 1] && (
                      <PageContent page={pages[spread * 2 - 1]} pageNum={spread * 2} sizeIdx={textSizeIdx} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {rightPage ? (
              <div
                className="h-full min-h-0 flex flex-col overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,249,195,0.25) 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                  marginLeft: '2px',
                  borderLeft: '1px solid rgba(230,210,170,0.5)',
                }}
              >
                <PageContent page={rightPage} pageNum={rightPageIdx + 1} sizeIdx={textSizeIdx} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-amber-600/30 text-sm">Blank</div>
            )}
          </div>
        </div>
        </div>

        {/* Text size & navigation - outside drag area so buttons are clickable */}
        <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-1 rounded-lg border border-amber-300/70 bg-white/90 px-2 py-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setTextSizeIdx((i) => Math.max(0, i - 1))}
              disabled={textSizeIdx === 0}
              className="rounded px-2 py-1 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Decrease text size"
            >
              A−
            </button>
            <span className="px-2 text-xs text-amber-700/80">{TEXT_SIZES[textSizeIdx].label}</span>
            <button
              type="button"
              onClick={() => setTextSizeIdx((i) => Math.min(2, i + 1))}
              disabled={textSizeIdx === 2}
              className="rounded px-2 py-1 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              title="Increase text size"
            >
              A+
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!hasPrev || isFlipping}
              className="rounded-lg border-2 border-amber-400/80 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <p className="text-sm text-amber-800/80">
              Pages {leftPageIdx + 1}–{Math.min(rightPageIdx + 1, totalPages)} of {totalPages}
            </p>
            <button
              type="button"
              onClick={goNext}
              disabled={!hasNext || isFlipping}
              className="rounded-lg border-2 border-amber-400/80 bg-white px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
