import { useState, useEffect } from 'react';
import { ScrollReveal } from './ScrollReveal';
import { IconStar } from './AnimatedIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchFeaturedTeachers, type FeaturedTeacher } from '@/lib/api';

const defaultPlaceholder = '/images/teacher-online.png';

function TeacherCard({ teacher, index, t }: { teacher: FeaturedTeacher; index: number; t: (k: string) => string }) {
  const photo = teacher.photoUrl || defaultPlaceholder;
  const rating = teacher.averageRating ?? 0;
  const reviewCount = teacher.reviewCount ?? 0;
  const experience = teacher.experienceMonths
    ? teacher.experienceMonths >= 12
      ? `${Math.floor(teacher.experienceMonths / 12)} yr exp`
      : `${teacher.experienceMonths} mo exp`
    : null;

  return (
    <ScrollReveal variant="fade-up" delay={index * 80}>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={photo}
              alt={teacher.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultPlaceholder;
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-brand-900">{teacher.name}</h3>
            {teacher.qualification && (
              <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{teacher.qualification}</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <IconStar className="h-4 w-4 shrink-0" />
                {rating.toFixed(1)}
              </span>
              {reviewCount > 0 && (
                <span>{reviewCount} {reviewCount === 1 ? t('featuredTeachers.review') : t('featuredTeachers.reviews')}</span>
              )}
              {experience && <span>{experience}</span>}
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

interface FeaturedTeachersProps {
  /** Section title - overrides i18n when provided */
  title?: string;
  /** Section subtitle - overrides i18n when provided */
  subtitle?: string;
  /** Max teachers to show */
  limit?: number;
  /** Context: parents page or teachers page */
  variant?: 'parents' | 'teachers';
}

export function FeaturedTeachers({
  title,
  subtitle,
  limit = 6,
  variant = 'parents',
}: FeaturedTeachersProps) {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<FeaturedTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionTitle = title ?? (variant === 'teachers' ? t('featuredTeachers.titleForTeachers') : t('featuredTeachers.title'));
  const sectionSubtitle = subtitle ?? (variant === 'teachers' ? t('featuredTeachers.subtitleForTeachers') : t('featuredTeachers.subtitle'));

  useEffect(() => {
    fetchFeaturedTeachers(limit)
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <section className="px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
          <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-50" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (teachers.length === 0) return null;

  return (
    <section className="px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal variant="fade-up">
          <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
            {sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
            {sectionSubtitle}
          </p>
        </ScrollReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher, i) => (
            <TeacherCard key={teacher._id} teacher={teacher} index={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
