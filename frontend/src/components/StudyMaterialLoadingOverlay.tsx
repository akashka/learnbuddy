import { useState } from 'react';
import { getRandomDidYouKnowFact } from '@/data/didYouKnowFacts';

/**
 * AI-style loading overlay for study material generation.
 * Fun, kid-friendly look with floating elements and animated book/robot.
 */
export default function StudyMaterialLoadingOverlay() {
  const [fact] = useState(() => getRandomDidYouKnowFact());
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-brand-100 via-violet-50 to-pink-50/90 backdrop-blur-sm">
      {/* Floating decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[20%] text-4xl opacity-30 animate-bounce" style={{ animationDuration: '2.5s' }}>📚</div>
        <div className="absolute right-[20%] top-[25%] text-3xl opacity-25 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.8s' }}>✨</div>
        <div className="absolute left-[25%] bottom-[30%] text-3xl opacity-25 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.2s' }}>💡</div>
        <div className="absolute right-[15%] bottom-[25%] text-4xl opacity-30 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.6s' }}>📖</div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Animated book + robot */}
        <div className="relative">
          <div className="flex items-center justify-center gap-4">
            <div className="relative" style={{ perspective: 200 }}>
              <div className="h-24 w-20 rounded-lg border-2 border-brand-200 bg-[#faf8f5] shadow-lg" style={{ boxShadow: '2px 4px 12px rgba(79,70,229,0.2)' }}>
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-md" style={{ perspective: 150 }}>
                  <div className="h-full w-1/2 origin-left bg-gradient-to-r from-transparent to-brand-200/50 animate-book-page-flip rounded-r" style={{ transformStyle: 'preserve-3d' }} />
                </div>
              </div>
            </div>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/90 shadow-xl ring-4 ring-brand-300/60 animate-pulse-soft">
              <span className="text-6xl">🤖</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-brand-900 md:text-3xl">
            AI is creating your study material!
          </h2>
          <p className="text-lg text-brand-700/90">
            Just a moment... your special textbook is being written ✨
          </p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>

        <p className="max-w-md text-center text-sm text-brand-600/80">
          Did you know? {fact}
        </p>
      </div>
    </div>
  );
}
