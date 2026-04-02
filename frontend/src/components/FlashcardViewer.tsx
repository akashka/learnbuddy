import { useState, useCallback } from 'react';

export interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  title?: string;
  onClose?: () => void;
}

export function FlashcardViewer({ cards, title = 'Flashcards', onClose }: FlashcardViewerProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));

  const displayIndex = order[index];
  const card = cards[displayIndex];
  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;

  const handlePrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }, []);

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(cards.length - 1, i + 1));
    setFlipped(false);
  }, [cards.length]);

  const doShuffle = useCallback(() => {
    setOrder((prev) => {
      const newOrder = [...prev];
      for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      }
      return newOrder;
    });
    setIndex(0);
    setFlipped(false);
  }, []);

  if (!cards.length || !card) {
    return (
      <div className="rounded-xl border border-brand-200 bg-white p-8 text-center">
        <p className="text-gray-600">No flashcards to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-brand-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
        <h3 className="font-semibold text-brand-800">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600" aria-live="polite" aria-atomic="true">
            {index + 1} / {cards.length}
          </span>
          <button
            type="button"
            onClick={doShuffle}
            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-100"
            aria-label="Shuffle flashcards"
          >
            Shuffle
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              aria-label="Close flashcard viewer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Live region announces card content changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {flipped ? `Answer: ${card.back}` : `Question: ${card.front}`}
      </div>

      <div className="p-6">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          aria-label={flipped ? 'Show question (currently showing answer)' : 'Show answer (currently showing question)'}
          className="group relative w-full min-h-[180px] rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 text-left shadow-md transition-all hover:border-brand-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="min-h-[120px]">
            <p className="text-sm font-medium uppercase tracking-wide text-brand-600" aria-hidden="true">
              {flipped ? 'Answer' : 'Question'}
            </p>
            <p className="mt-2 text-lg text-gray-800 whitespace-pre-wrap">
              {flipped ? card.back : card.front}
            </p>
          </div>
          <span className="absolute bottom-2 right-2 text-xs text-gray-400 group-hover:text-brand-600" aria-hidden="true">
            Click to flip
          </span>
        </button>

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            aria-label="Previous card"
            className="rounded-lg border border-brand-300 bg-white px-4 py-2 text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            aria-label="Next card"
            className="rounded-lg border border-brand-300 bg-white px-4 py-2 text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
