import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '@/components/ScrollReveal';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchPageContent } from '@/lib/api';

const defaultRoleKeys = [
  { to: '/for-parents', titleKey: 'nav.forParents', descKey: 'forYou.forParentsDesc', emoji: '👨‍👩‍👧', gradient: 'from-brand-50 via-white to-accent-50/40', border: 'border-brand-100', image: '/images/parent-student-progress.png', accent: '🎯' },
  { to: '/for-students', titleKey: 'nav.forStudents', descKey: 'forYou.forStudentsDesc', emoji: '📚', gradient: 'from-accent-50/50 via-white to-brand-50/50', border: 'border-accent-100', image: '/images/kids-learning-home.png', accent: '✨' },
  { to: '/for-teachers', titleKey: 'nav.forTeachers', descKey: 'forYou.forTeachersDesc', emoji: '👩‍🏫', gradient: 'from-brand-50/80 via-white to-accent-50/60', border: 'border-brand-200', image: '/images/teacher-online.png', accent: '💼' },
];

export default function ForYou() {
  const { t } = useLanguage();
  const [rolesFromApi, setRolesFromApi] = useState<Array<{ to: string; title: string; desc: string; emoji?: string; gradient?: string; border?: string; image?: string; accent?: string }> | null>(null);

  useEffect(() => {
    fetchPageContent('for-you')
      .then((res) => {
        const r = res.sections.roles;
        if (Array.isArray(r) && r.length > 0) setRolesFromApi(r);
      })
      .catch(() => {});
  }, []);

  const roles = rolesFromApi ?? defaultRoleKeys.map((r) => ({ ...r, title: t(r.titleKey), desc: t(r.descKey) }));
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">👨‍👩‍👧</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>📚</div>
        <div className="pointer-events-none absolute right-[20%] bottom-[30%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '1s' }}>👩‍🏫</div>
        <div className="relative mx-auto max-w-5xl text-center">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              {t('forYou.title')}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-600">
              {t('forYou.subtitle')}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Role cards */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up" delay={0}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Choose your path
            </h2>
          </ScrollReveal>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {roles.map((role, i) => (
              <ScrollReveal key={role.to} variant="fade-up" delay={(i + 1) * 80}>
                <Link
                  to={role.to}
                  className={`card-funky group block overflow-hidden rounded-2xl border-2 ${role.border} bg-gradient-to-br ${role.gradient} shadow-lg transition hover:shadow-xl`}
                >
                  <div className="relative h-40 overflow-hidden sm:h-48">
                    <img
                      src={role.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute right-4 top-4 text-5xl opacity-90 drop-shadow-lg sm:text-6xl" style={{ animationDelay: `${i * 0.2}s` }}>
                      {role.emoji}
                    </div>
                  </div>
                  <div className="relative p-6 sm:p-8">
                    <div className="pointer-events-none absolute right-6 top-6 text-4xl opacity-20 animate-float sm:text-5xl" style={{ animationDelay: `${i * 0.15}s` }}>
                      {role.accent}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-brand-900">{role.title}</h3>
                    <p className="mt-3 text-base text-gray-700 sm:text-lg">{role.desc}</p>
                    <span className="mt-4 inline-flex items-center text-brand-600 font-semibold transition group-hover:underline">
                      {t('common.learnMore')} →
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Explore more */}
      <section className="px-4 pt-8 pb-8 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8">
          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">{t('common.exploreMore')}</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  {t('common.home')}
                </Link>
                <Link to="/how-it-works" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  {t('common.howItWorks')}
                </Link>
                <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  {t('common.features')}
                </Link>
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  {t('common.aboutUs')}
                </Link>
                <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  {t('common.contactUs')}
                </Link>
                <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  {t('common.faq')}
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
