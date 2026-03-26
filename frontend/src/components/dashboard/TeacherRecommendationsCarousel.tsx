import { useMemo, useRef } from 'react';
import { AccordionSection } from './AccordionSection';

type RecommendedTeacher = {
  teacherId: string;
  name: string;
  photoUrl?: string;
  matchReason: string;
  matchedSubjects: string[];
};

interface TeacherRecommendationsCarouselProps {
  teachers: RecommendedTeacher[];
}

export function TeacherRecommendationsCarousel({ teachers }: TeacherRecommendationsCarouselProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const safeTeachers = useMemo(() => teachers ?? [], [teachers]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = listRef.current;
    if (!el) return;
    const cardWidth = 340; // matches min-w below
    el.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  };

  if (safeTeachers.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-brand-800">
          <span>🏆</span> Best teacher matches
        </h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-200 bg-white shadow-sm transition hover:border-brand-400 hover:shadow-md"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-200 bg-white shadow-sm transition hover:border-brand-400 hover:shadow-md"
          >
            →
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {safeTeachers.map((t) => (
          <div key={t.teacherId} className="min-w-[340px]">
            <AccordionSection title={t.name} icon="👩‍🏫" defaultOpen={false}>
              <div className="flex items-start gap-3">
                {t.photoUrl ? (
                  <img
                    src={t.photoUrl}
                    alt={t.name}
                    className="h-12 w-12 rounded-2xl object-cover shadow-sm border border-brand-100"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-brand-100 flex items-center justify-center text-xl shadow-sm border border-brand-100">
                    👩‍🏫
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-800">{t.matchReason}</p>
                  {t.matchedSubjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {t.matchedSubjects.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-brand-600">
                Tap into Marketplace to book your first class with {t.name.split(' ')[0]}.
              </div>
            </AccordionSection>
          </div>
        ))}
      </div>

      <div className="mt-3 sm:hidden flex items-center justify-between">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByCard(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-200 bg-white shadow-sm transition hover:border-brand-400 hover:shadow-md"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByCard(1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-200 bg-white shadow-sm transition hover:border-brand-400 hover:shadow-md"
        >
          →
        </button>
      </div>
    </div>
  );
}

