import { useState, useCallback } from 'react';
import { ScratchReveal } from '@/components/ScratchReveal';

export interface Flashcard {
  front: string;
  back: string;
}

interface StudyMaterialFlashcardsProps {
  cards: Flashcard[];
  title?: string;
}

export function StudyMaterialFlashcards({ cards, title = 'Test what you understood!' }: StudyMaterialFlashcardsProps) {
  const [index, setIndex] = useState(0);

  const card = cards[index];
  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;

  const handlePrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }, [cards.length]);

  if (!cards.length || !card) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-200/30 blur-2xl" />
        <div className="absolute -left-8 bottom-1/4 h-24 w-24 rounded-full bg-violet-200/30 blur-xl" />
        <div className="absolute right-1/4 top-0 text-5xl opacity-10 animate-float">📝</div>
        <div className="absolute left-1/4 bottom-0 text-5xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>💡</div>
        <div className="absolute right-8 top-1/3 text-4xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>✨</div>
      </div>

      <div className="relative">
        <div className="bg-gradient-to-r from-brand-500 via-violet-500 to-brand-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/90">{index + 1} of {cards.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
              🎯
            </div>
          </div>
        </div>

        <div className="relative p-6">
          <div className="mb-5 rounded-xl border-l-4 border-brand-400 bg-gradient-to-r from-brand-50 to-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Question</p>
            <p className="mt-2 text-lg font-medium text-gray-800 whitespace-pre-wrap">{card.front}</p>
          </div>

          <ScratchReveal
            key={index}
            scratchHint="Scratch to reveal answer"
            hiddenContent={
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Answer</p>
                <p className="mt-2 text-lg text-gray-800 whitespace-pre-wrap">{card.back}</p>
              </>
            }
          />

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev}
              className="flex items-center gap-2 rounded-xl border-2 border-brand-300 bg-white px-5 py-2.5 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2 rounded-xl border-2 border-brand-300 bg-white px-5 py-2.5 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
              Next
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
