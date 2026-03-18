import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchLandingData, fetchBoardClassSubjects, type LandingData } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppDownload } from '@/components/AppDownload';
import { ScrollReveal } from '@/components/ScrollReveal';
import { TrustBadges } from '@/components/TrustBadges';
import { CountUp } from '@/components/CountUp';
import {
  IconUser,
  IconPhone,
  IconBook,
  IconChart,
  IconHome,
  IconRobot,
  IconChat,
  IconCheck,
  IconStar,
} from '@/components/AnimatedIcon';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3007';

const STAT_LABEL_KEYS = ['home.stats.studentsLearning', 'home.stats.expertTeachers', 'home.stats.performanceImprovement', 'home.stats.appRating'] as const;
const statsData = [
  { value: '10K+', labelKey: STAT_LABEL_KEYS[0], delay: 0 },
  { value: '500+', labelKey: STAT_LABEL_KEYS[1], delay: 0.1 },
  { value: '94%', labelKey: STAT_LABEL_KEYS[2], delay: 0.2 },
  { value: '4.9', labelKey: STAT_LABEL_KEYS[3], delay: 0.3 },
];

const defaultAiFeatures = [
  { title: 'Class Monitoring', desc: 'AI watches every session for safety & quality' },
  { title: 'Exam Generation', desc: 'Smart tests tailored to your syllabus' },
  { title: 'Instant Doubt Help', desc: 'Ask anything—AI explains like a friend' },
  { title: 'Study Materials', desc: 'AI creates notes, summaries, practice' },
];

const defaultSubjects = ['Math', 'Science', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];
const defaultClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const defaultBoards = ['CBSE', 'ICSE', 'State Boards'];

const defaultReviews = [
  { name: 'Priya M.', role: 'Parent', text: 'My daughter\'s math improved by 40% in 3 months. The AI doubt help is amazing!', rating: 5 },
  { name: 'Rahul K.', role: 'Teacher', text: 'I earn 3x more than teaching offline. Flexible schedule, great support.', rating: 5 },
  { name: 'Anita S.', role: 'Parent', text: 'Love knowing AI monitors every class. Peace of mind while my son learns.', rating: 5 },
  { name: 'Vikram T.', role: 'Teacher', text: 'AI tools help me focus on teaching. Exam prep is so much easier.', rating: 5 },
  { name: 'Sneha R.', role: 'Parent', text: 'My kids love learning from home. No more rushing to tuition centers!', rating: 5 },
  { name: 'Meera P.', role: 'Parent', text: 'Good platform overall. Sometimes the app is a bit slow, but teachers are great.', rating: 4 },
  { name: 'Arjun D.', role: 'Teacher', text: 'Decent earnings. Would like more flexibility in scheduling. Support team is helpful.', rating: 4 },
  { name: 'Kavita N.', role: 'Parent', text: 'Started well. Had a small issue with a class reschedule but it was resolved quickly.', rating: 4 },
];

export default function Home() {
  const { t } = useLanguage();
  const [data, setData] = useState<LandingData | null>(null);
  const [masterPills, setMasterPills] = useState<string[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);

  const updateReviewScrollState = () => {
    const el = reviewsScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    fetchLandingData()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    fetchBoardClassSubjects()
      .then((res) => {
        const boards = res.boards?.length ? res.boards : defaultBoards;
        const rawClasses = res.classes?.length ? res.classes : defaultClasses;
        const classes = rawClasses.map((c) => (/^\d+$/.test(String(c)) ? `Class ${c}` : c));
        const subjects = res.mappings
          ? [...new Set(res.mappings.flatMap((m) => m.subjects || []))].filter(Boolean)
          : res.subjects?.length
            ? res.subjects
            : defaultSubjects;
        const mixed = [...boards, ...classes, ...subjects].sort(() => Math.random() - 0.5);
        setMasterPills(mixed);
      })
      .catch(() => setMasterPills([...defaultBoards, ...defaultClasses.slice(0, 5), ...defaultSubjects.slice(0, 5)]));
  }, []);

  const statsRaw = data?.stats?.length ? data.stats : statsData;
  const stats = statsRaw.map((s, i) => {
    const item = s as { value?: string; label?: string; labelKey?: string; raw?: number; delay?: number };
    return {
      ...item,
      label: item.labelKey ? t(item.labelKey) : (item.label ?? ''),
      value: item.value ?? '',
      raw: item.raw,
      delay: item.delay ?? 0,
    };
  });
  const reviews = data?.reviews?.length ? data.reviews : defaultReviews;
  const howItWorks = data?.howItWorks?.length
    ? data.howItWorks
    : [
        { step: 1, title: t('home.howItWorks.choose'), desc: t('home.howItWorks.chooseDesc'), icon: '👤' },
        { step: 2, title: t('home.howItWorks.connect'), desc: t('home.howItWorks.connectDesc'), icon: '📱' },
        { step: 3, title: t('home.howItWorks.learn'), desc: t('home.howItWorks.learnDesc'), icon: '📚' },
        { step: 4, title: t('home.howItWorks.grow'), desc: t('home.howItWorks.growDesc'), icon: '📈' },
      ];
  const benefits = data?.benefits?.length
    ? data.benefits
    : [
        { icon: '🏠', title: t('home.benefits.learnFromHome'), desc: t('home.benefits.learnFromHomeDesc') },
        { icon: '🤖', title: t('home.benefits.aiMonitored'), desc: t('home.benefits.aiMonitoredDesc') },
        { icon: '💬', title: t('home.benefits.askAiAnytime'), desc: t('home.benefits.askAiAnytimeDesc') },
        { icon: '📊', title: t('home.benefits.trackProgress'), desc: t('home.benefits.trackProgressDesc') },
      ];
  const aiFeatures = data?.aiFeatures?.length ? data.aiFeatures : defaultAiFeatures;
  const roleCards = data?.roleCards?.length
    ? data.roleCards
    : [
        { to: '/for-parents', title: t('nav.forParents'), image: '/images/parent-student-progress.png', desc: t('forYou.forParentsDesc') },
        { to: '/for-students', title: t('nav.forStudents'), image: '/images/kids-learning-home.png', desc: t('forYou.forStudentsDesc') },
        { to: '/for-teachers', title: t('nav.forTeachers'), image: '/images/teacher-online.png', desc: t('forYou.forTeachersDesc') },
      ];
  const pills = masterPills.length ? masterPills : [...defaultBoards, ...defaultClasses.slice(0, 5), ...defaultSubjects.slice(0, 5)];

  const pillRows = useMemo(() => {
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    return [
      shuffle(pills),
      shuffle(pills).reverse(),
      shuffle(pills),
    ];
  }, [pills]);

  useEffect(() => {
    const el = reviewsScrollRef.current;
    if (!el) return;
    const update = () => requestAnimationFrame(updateReviewScrollState);
    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [reviews.length]);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white via-accent-50/40 to-brand-50/60 px-6 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_20%,_var(--tw-gradient-stops))] from-brand-200/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_80%_80%,_var(--tw-gradient-stops))] from-accent-200/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,_var(--tw-gradient-stops))] from-brand-100/30 via-transparent to-transparent" />
        <div className="absolute right-0 top-10 opacity-35">
          <div className="animate-float h-40 w-40 rounded-full bg-brand-400 blur-3xl sm:h-52 sm:w-52" />
        </div>
        <div className="absolute bottom-16 left-0 opacity-35">
          <div className="animate-float h-48 w-48 rounded-full bg-accent-400 blur-3xl sm:h-64 sm:w-64" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute left-1/4 top-1/4 opacity-25">
          <div className="animate-float h-24 w-24 rounded-full bg-brand-300 blur-2xl sm:h-32 sm:w-32" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="pointer-events-none absolute left-[5%] top-[15%] text-5xl opacity-25 animate-float sm:text-6xl md:text-7xl">📚</div>
        <div className="pointer-events-none absolute right-[8%] top-[25%] text-4xl opacity-25 animate-float sm:text-5xl md:text-6xl" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[20%] text-4xl opacity-25 animate-float sm:text-5xl md:text-6xl" style={{ animationDelay: '1.5s' }}>🎯</div>
        <div className="pointer-events-none absolute right-[5%] bottom-[25%] text-5xl opacity-25 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '0.8s' }}>🌟</div>

        <div className="relative mx-auto max-w-[1400px]">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl md:text-6xl lg:text-7xl">
              {t('home.heroTitle')}
              <span className="mt-2 block bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent">
                {t('home.learnWithFun')}
              </span>
            </h1>
            <p className="mx-auto mt-6 text-lg text-gray-600 sm:text-xl">
              {t('home.heroSubtext')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`${APP_URL}/parent/register`}
                className="btn-funky w-full rounded-2xl bg-brand-600 px-8 py-4 text-center text-lg font-semibold text-white shadow-xl hover:bg-brand-700 hover:shadow-2xl sm:w-auto"
              >
                {t('home.findTeacher')}
              </a>
              <a
                href={`${APP_URL}/teacher/register`}
                className="w-full rounded-2xl border-2 border-brand-200 bg-white px-8 py-4 text-center text-lg font-semibold text-gray-700 transition hover:bg-brand-50 sm:w-auto"
              >
                {t('home.becomeTeacher')}
              </a>
            </div>
            <div className="mt-8">
              <AppDownload variant="compact" />
            </div>
          </div>

          {/* Hero image */}
          <div className="mt-16 flex justify-center">
            <div className="animate-scale-in overflow-hidden rounded-3xl border-4 border-brand-100 bg-white shadow-2xl ring-4 ring-brand-200/30">
              <img
                src="/images/hero-learning.png"
                alt="Child learning online with LearnBuddy"
                className="h-64 w-full max-w-2xl object-cover object-center sm:h-80 md:h-96"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats - dynamic from API, animated */}
      <section className="relative overflow-hidden border-y border-brand-100 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 py-14 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.slice(0, 4).map((stat, i) => (
              <ScrollReveal key={i} variant="scale" delay={i * 100}>
                <div className="group cursor-default rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-sm transition hover:scale-105 hover:bg-white/20 hover:shadow-xl">
                  <CountUp value={stat.value} label={stat.label} raw={(stat as { raw?: number }).raw} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/30 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        <div className="absolute right-0 top-1/4 text-8xl opacity-20 animate-float">📱</div>
        <div className="absolute bottom-1/4 left-0 text-7xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>📚</div>
        <div className="relative mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              {t('home.howItWorks.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              {t('home.howItWorks.subtitle')}
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, i) => {
              const Icon = [IconUser, IconPhone, IconBook, IconChart][i];
              const gradients = [
                'from-brand-50 via-white to-accent-50/50',
                'from-accent-50/50 via-white to-brand-50',
                'from-brand-50/80 via-white to-accent-50/60',
                'from-accent-50/60 via-white to-brand-50/80',
              ];
              return (
                <ScrollReveal key={i} variant="fade-up" delay={i * 100}>
                  <div className={`group card-funky flex h-full min-h-[220px] flex-col rounded-2xl border-2 border-brand-100 bg-gradient-to-br ${gradients[i]} p-6 text-center shadow-sm transition hover:border-brand-300 hover:shadow-lg`}>
                    <div className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 transition group-hover:scale-110">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision & Mission - moved up */}
      {data?.company && (
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-white sm:px-8 sm:py-20 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(255,255,255,0.15)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,_rgba(251,191,36,0.08)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 20V40H20\'/%3E%3C/g%3E%3C/svg%3E')]" />
          <div className="pointer-events-none absolute left-[8%] top-[20%] text-5xl opacity-20 animate-float sm:text-6xl md:text-7xl">👨‍👩‍👧‍👦</div>
          <div className="pointer-events-none absolute right-[12%] top-[15%] text-5xl opacity-20 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '0.5s' }}>👩‍🎓</div>
          <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-20 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '1s' }}>👨‍🏫</div>
          <div className="pointer-events-none absolute right-[8%] bottom-[20%] text-5xl opacity-20 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '0.3s' }}>😊</div>
          <div className="pointer-events-none absolute left-[45%] top-[35%] text-4xl opacity-15 animate-float sm:text-5xl" style={{ animationDelay: '0.8s' }}>🌟</div>
          <div className="pointer-events-none absolute right-[35%] bottom-[30%] text-4xl opacity-15 animate-float sm:text-5xl" style={{ animationDelay: '1.2s' }}>💡</div>
          <div className="relative mx-auto max-w-[1400px] text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">{t('home.ourVision')}</p>
            <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl md:text-4xl">
              {data.company.vision}
            </h2>
            <p className="mt-6 text-lg text-brand-100">{data.company.mission}</p>
            <Link
              to="/about-us"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-white/50 px-6 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              {t('home.learnMoreAboutUs')}
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Benefits - Why LearnBuddy */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600/5 via-white to-accent-50/40 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute right-0 top-1/3 flex items-center gap-2 opacity-30">
          <IconRobot className="h-24 w-24 animate-float text-brand-500" />
          <span className="text-6xl animate-float" style={{ animationDelay: '0.5s' }}>🤖</span>
        </div>
        <div className="absolute bottom-1/3 left-0 opacity-25">
          <div className="h-32 w-32 rounded-full border-4 border-dashed border-brand-400 animate-spin" style={{ animationDuration: '20s' }} />
        </div>
        <div className="relative mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              {t('home.whyLearnBuddy')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              {t('home.whyLearnBuddySub')}
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={50}>
            <TrustBadges variant="section" className="mb-8 mt-8" />
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => {
              const Icon = [IconHome, IconRobot, IconChat, IconChart][i];
              return (
                <ScrollReveal key={i} variant="fade-up" delay={i * 80}>
                  <div className="group card-funky flex h-full min-h-[180px] flex-col rounded-2xl bg-gradient-to-br from-brand-200/40 via-white to-accent-200/40 p-[2px] shadow-sm transition hover:shadow-lg">
                    <div className="flex h-full min-h-[176px] flex-col rounded-[calc(1rem-2px)] bg-white p-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100/50 text-brand-600 transition group-hover:scale-110">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{b.title}</h3>
                      <p className="mt-2 flex-1 text-sm text-gray-600">{b.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Online vs Offline Comparison */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50/60 via-white to-accent-50/50 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,_rgba(251,191,36,0.06)_0%,_transparent_50%)]" />
        <div className="pointer-events-none absolute right-[15%] top-[20%] text-6xl opacity-15 animate-float sm:text-7xl" style={{ animationDelay: '0.5s' }}>📊</div>
        <div className="pointer-events-none absolute left-[10%] bottom-[25%] text-5xl opacity-12 animate-float sm:text-6xl" style={{ animationDelay: '1s' }}>⚖️</div>
        <div className="relative mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              {t('home.onlineVsOffline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              {t('home.onlineVsOfflineSub')}
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="card-funky mt-12 overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-brand-100 bg-gradient-to-r from-brand-50 to-accent-50/50">
                      <th className="px-4 py-4 text-left font-display text-base font-bold text-brand-900 sm:px-6 sm:py-5 sm:text-lg">
                        {t('home.factor')}
                      </th>
                      <th className="px-4 py-4 text-center font-display text-base font-bold text-brand-900 sm:px-6 sm:py-5 sm:text-lg">
                        {t('home.offlineTuition')}
                      </th>
                      <th className="bg-gradient-to-r from-brand-100/60 to-accent-100/50 px-4 py-4 text-center font-display text-base font-bold text-brand-900 sm:px-6 sm:py-5 sm:text-lg">
                        {t('home.learnBuddyOnline')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    <tr className="transition hover:bg-brand-50/30">
                      <td className="px-4 py-4 font-medium text-gray-700 sm:px-6 sm:py-5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">💰</span> {t('home.cost')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 sm:px-6 sm:py-5">
                        {t('home.costOffline')}
                      </td>
                      <td className="bg-brand-50/30 px-4 py-4 text-center font-medium text-brand-700 sm:px-6 sm:py-5">
                        {t('home.costOnline')}
                      </td>
                    </tr>
                    <tr className="transition hover:bg-brand-50/30">
                      <td className="px-4 py-4 font-medium text-gray-700 sm:px-6 sm:py-5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">⏱️</span> {t('home.time')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 sm:px-6 sm:py-5">
                        {t('home.timeOffline')}
                      </td>
                      <td className="bg-brand-50/30 px-4 py-4 text-center font-medium text-brand-700 sm:px-6 sm:py-5">
                        {t('home.timeOnline')}
                      </td>
                    </tr>
                    <tr className="transition hover:bg-brand-50/30">
                      <td className="px-4 py-4 font-medium text-gray-700 sm:px-6 sm:py-5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">📅</span> {t('home.flexibility')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 sm:px-6 sm:py-5">
                        {t('home.flexOffline')}
                      </td>
                      <td className="bg-brand-50/30 px-4 py-4 text-center font-medium text-brand-700 sm:px-6 sm:py-5">
                        {t('home.flexOnline')}
                      </td>
                    </tr>
                    <tr className="transition hover:bg-brand-50/30">
                      <td className="px-4 py-4 font-medium text-gray-700 sm:px-6 sm:py-5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">🛡️</span> {t('home.safety')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 sm:px-6 sm:py-5">
                        {t('home.safetyOffline')}
                      </td>
                      <td className="bg-brand-50/30 px-4 py-4 text-center font-medium text-brand-700 sm:px-6 sm:py-5">
                        {t('home.safetyOnline')}
                      </td>
                    </tr>
                    <tr className="transition hover:bg-brand-50/30">
                      <td className="px-4 py-4 font-medium text-gray-700 sm:px-6 sm:py-5">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">🤖</span> {t('home.doubtHelp')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600 sm:px-6 sm:py-5">
                        {t('home.doubtOffline')}
                      </td>
                      <td className="bg-brand-50/30 px-4 py-4 text-center font-medium text-brand-700 sm:px-6 sm:py-5">
                        {t('home.doubtOnline')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border-t border-brand-100 bg-gradient-to-r from-brand-50/50 to-accent-50/30 px-4 py-3 text-center text-sm text-gray-600 sm:px-6 sm:py-4">
                {t('home.compareCta')}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* AI Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(251,191,36,0.08)_0%,_transparent_40%)]" />
        <div className="absolute left-1/4 top-1/4 h-20 w-20 rounded-full bg-white/5 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute right-1/3 top-1/2 h-16 w-16 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/2 h-24 w-24 rounded-full bg-accent-400/10 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'30\' height=\'30\' viewBox=\'0 0 30 30\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M15 0L30 15L15 30L0 15Z\' fill=\'%23ffffff\' fill-opacity=\'0.02\'/%3E%3C/svg%3E')] opacity-60" />
        <div className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-10">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold sm:text-4xl md:text-5xl">
              {t('home.howAiHelps')}
            </h2>
          </ScrollReveal>
          <div className="mt-16 grid gap-8 md:grid-cols-2 md:items-stretch">
            <ScrollReveal variant="slide-right" delay={100}>
              <div className="flex items-center justify-center">
                <img
                  src="/images/ai-monitoring-screen.png"
                  alt="AI monitoring class"
                  className="h-full min-h-[360px] w-full max-w-md rounded-2xl object-contain object-center shadow-2xl"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal variant="slide-left" delay={150}>
              <div className="flex flex-col gap-4">
                {aiFeatures.map((f, i) => {
                  const icons = ['🔒', '📹', '💬', '📄'];
                  return (
                    <div key={i} className="flex min-h-[70px] flex-1 items-start gap-4 rounded-xl bg-white/10 p-4 backdrop-blur">
                      <span className="text-2xl">{icons[i]}</span>
                      <div>
                        <h3 className="font-display font-bold">{f.title}</h3>
                        <p className="mt-1 text-sm text-brand-100">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Connection: Parent, Student, Teacher */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50/60 via-white to-accent-50/50 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(99,102,241,0.12)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_rgba(251,191,36,0.1)_0%,_transparent_50%)]" />
        <div className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full border-2 border-brand-200/40 animate-float" />
        <div className="absolute right-1/3 top-1/3 h-32 w-32 rounded-full border-2 border-brand-200/30 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full border-2 border-accent-200/50 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute right-1/4 bottom-1/3 h-28 w-28 rounded-full border-2 border-brand-200/25 animate-float" style={{ animationDelay: '0.3s' }} />
        <div className="relative mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              Everyone Connected
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              Parents, students, and teachers—all in one place. AI monitors and helps.
            </p>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {roleCards.map((card, i) => (
              <ScrollReveal key={card.to} variant="fade-up" delay={i * 100}>
                <Link to={card.to} className="group card-funky block overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-lg">
                  <img src={card.image} alt={card.title} className="h-40 w-full object-cover transition group-hover:scale-105" />
                  <div className="p-6 text-center">
                    <h3 className="font-display text-xl font-bold text-brand-900">{card.title}</h3>
                    <p className="mt-2 text-gray-600">{card.desc}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Learn from Home + AI */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/50 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,_rgba(99,102,241,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,_rgba(251,191,36,0.08)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-200/25 blur-3xl" />
        <div className="absolute left-0 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-200/40 animate-spin" style={{ animationDuration: '25s' }} />
        <div className="absolute right-1/4 top-1/4 h-20 w-20 rounded-full bg-accent-200/30 animate-float" />
        <div className="relative mx-auto max-w-[1400px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <ScrollReveal variant="slide-right">
              <div>
                <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
                  {t('home.learnFromHomeTitle')}
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  {t('home.learnFromHomeDesc')}
                </p>
                <ul className="mt-6 space-y-3 text-gray-600">
                  <li className="group flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    {t('home.liveClasses')}
                  </li>
                  <li className="group flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    {t('home.aiMonitorsSession')}
                  </li>
                  <li className="group flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    {t('home.askAiDoubts')}
                  </li>
                  <li className="group flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <IconCheck className="h-5 w-5" />
                    </span>
                    {t('home.parentsReports')}
                  </li>
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal variant="slide-left">
              <div className="flex justify-center">
                <div className="overflow-hidden rounded-2xl border-2 border-brand-100 shadow-xl ring-4 ring-brand-100/50">
                  <img
                    src="/images/kids-learning-home.png"
                    alt="Kids learning from home"
                    className="h-72 w-full max-w-md object-cover object-center sm:h-80 md:h-96"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Classes & Subjects - 3 rows, complete listing, marquee scrolling */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.05)_0%,_transparent_70%)]" />
        <div className="relative w-full">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl px-4">
              All Classes & Subjects
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600 px-4">
              Boards, classes, and subjects—we've got you covered.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="mt-12 flex flex-col gap-4">
              {[0, 1, 2].map((row) => {
                const scrollLeft = row === 0 || row === 2;
                const rowPills = pillRows[row];
                return (
                  <div key={row} className="overflow-hidden">
                    <div className={`flex shrink-0 flex-nowrap gap-2 sm:gap-3 ${scrollLeft ? 'animate-marquee-left' : 'animate-marquee-right'}`} style={{ width: 'max-content' }}>
                      {[...rowPills, ...rowPills, ...rowPills].map((label, i) => (
                        <span
                          key={`${row}-${i}`}
                          className="pill-funky shrink-0 cursor-default rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 transition hover:scale-105 hover:bg-brand-200 sm:px-5 sm:py-2.5 sm:text-base"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Performance & Teacher Monetization */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30 px-6 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(99,102,241,0.05)_0%,_transparent_50%)]" />
        <div className="relative mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <ScrollReveal variant="fade-up" delay={0}>
              <div className="card-funky flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                <div className="relative h-40 shrink-0 overflow-hidden">
                  <img src="/images/kids-learning-home.png" alt="Student learning" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-bold text-brand-900">{t('home.studentPerformance')}</h3>
                  <p className="mt-2 text-gray-600">{t('home.studentPerformanceDesc')}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">+40%</div>
                      <div className="text-xs text-gray-600 sm:text-sm">avg score improvement</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">3x</div>
                      <div className="text-xs text-gray-600 sm:text-sm">more engagement</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">94%</div>
                      <div className="text-xs text-gray-600 sm:text-sm">improvement rate</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">1:1</div>
                      <div className="text-xs text-gray-600 sm:text-sm">personalized</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="card-funky flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                <div className="relative h-40 shrink-0 overflow-hidden">
                  <img src="/images/teacher-online.png" alt="Teacher" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-bold text-brand-900">Teachers Earn More</h3>
                  <p className="mt-2 text-gray-600">Teach on your terms. Fair pay, flexible schedule.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">3x</div>
                      <div className="text-xs text-gray-600 sm:text-sm">vs offline</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">500+</div>
                      <div className="text-xs text-gray-600 sm:text-sm">teachers</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">Flexible</div>
                      <div className="text-xs text-gray-600 sm:text-sm">schedule</div>
                    </div>
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <div className="font-display text-xl font-bold text-brand-600">BGV</div>
                      <div className="text-xs text-gray-600 sm:text-sm">verified</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="relative overflow-hidden px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_rgba(99,102,241,0.06)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_rgba(251,191,36,0.05)_0%,_transparent_50%)]" />
        <div className="pointer-events-none absolute left-[5%] top-[20%] text-6xl opacity-15 animate-float sm:text-7xl md:text-8xl">📱</div>
        <div className="pointer-events-none absolute right-[8%] top-[15%] text-6xl opacity-15 animate-float sm:text-7xl md:text-8xl" style={{ animationDelay: '0.5s' }}>📲</div>
        <div className="pointer-events-none absolute left-[10%] bottom-[25%] text-5xl opacity-12 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '1s' }}>📚</div>
        <div className="pointer-events-none absolute right-[12%] bottom-[20%] text-5xl opacity-12 animate-float sm:text-6xl md:text-7xl" style={{ animationDelay: '0.3s' }}>✨</div>
        <div className="pointer-events-none absolute left-[45%] top-[10%] text-5xl opacity-10 animate-float sm:text-6xl" style={{ animationDelay: '0.8s' }}>📶</div>
        <div className="pointer-events-none absolute right-[35%] bottom-[30%] text-5xl opacity-10 animate-float sm:text-6xl" style={{ animationDelay: '1.2s' }}>🎯</div>
        <div className="relative mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              {t('home.learnOnGo')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              {t('home.learnOnGoSub')}
            </p>
          </ScrollReveal>
          <ScrollReveal variant="scale" delay={150}>
          <div className="mt-12 flex justify-center">
            <div className="animate-float overflow-hidden rounded-3xl border-4 border-gray-800 shadow-2xl">
              <img
                src="/images/app-screenshot.png"
                alt="LearnBuddy app on mobile"
                className="h-80 w-auto object-contain sm:h-96"
              />
            </div>
          </div>
          </ScrollReveal>
          <div className="mt-12 flex justify-center">
            <AppDownload variant="compact" />
          </div>
        </div>
      </section>

      {/* Reviews - standard card size, full width row, arrows only */}
      <section className="bg-brand-50/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="w-full">
          <ScrollReveal variant="fade-up">
            <h2 className="font-display text-center text-3xl font-bold text-brand-900 sm:text-4xl">
              {t('home.whatPeopleSay')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
              {t('home.whatPeopleSaySub')}
            </p>
          </ScrollReveal>
          <div className="mt-12 flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                const el = reviewsScrollRef.current;
                if (el) el.scrollBy({ left: -420, behavior: 'smooth' });
              }}
              disabled={!canScrollLeft}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-brand-200 sm:h-12 sm:w-12"
              aria-label="Scroll reviews left"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              ref={reviewsScrollRef}
              className="scrollbar-hide flex flex-1 flex-nowrap gap-4 overflow-x-auto scroll-smooth py-2"
            >
              {reviews.map((r, i) => (
                  <div
                    key={i}
                    className="card-funky w-[400px] shrink-0 rounded-[28px] border border-brand-100 bg-gradient-to-br from-white via-brand-50/30 to-accent-50/40 p-6 shadow-lg"
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <IconStar
                          key={j}
                          className={`h-5 w-5 ${j < r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 text-base text-gray-700">&ldquo;{r.text}&rdquo;</p>
                    <p className="mt-4 font-semibold text-brand-800">{r.name}</p>
                    <p className="text-sm text-gray-500">{r.role}</p>
                  </div>
                ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const el = reviewsScrollRef.current;
                if (el) el.scrollBy({ left: 420, behavior: 'smooth' });
              }}
              disabled={!canScrollRight}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-brand-200 sm:h-12 sm:w-12"
              aria-label="Scroll reviews right"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
