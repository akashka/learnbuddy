import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '@/components/ScrollReveal';
import { IconUser, IconPhone, IconBook, IconChart } from '@/components/AnimatedIcon';
import { fetchPageContent } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const ICONS = [IconUser, IconPhone, IconBook, IconChart];

const defaultFourSteps = [
  { step: 1, title: 'Choose', desc: 'Pick a teacher from our verified marketplace', icon: '👤' },
  { step: 2, title: 'Connect', desc: 'Book a slot and join live class from home', icon: '📱' },
  { step: 3, title: 'Learn', desc: 'One-to-one with AI monitoring for safety', icon: '📚' },
  { step: 4, title: 'Grow', desc: 'Track progress, get AI help, exams & feedback', icon: '📈' },
];

const defaultForParentsSteps = [
  "Download the app from Play Store or App Store",
  "Sign up as a parent and add your child's details (board, class, subject)",
  "Browse the marketplace. Filter by board, class, subject. Read reviews.",
  "Choose a batch, pay securely, and your child is enrolled",
  "Your child joins live one-to-one classes. AI monitors every session.",
];

const defaultForStudentsSteps = [
  "Log in with your student ID (set by your parent)",
  "View your classes and join live sessions",
  "Ask AI doubts anytime between classes",
  "Take AI-generated exams and track your progress",
];

const defaultForTeachersSteps = [
  "Register, complete profile, pass AI qualification exam",
  "Complete BGV check for verification",
  "Set your schedule, board, class, subject",
  "Conduct live classes. Use AI tools for materials and exams.",
  "Monthly payouts. Transparent commission.",
];

export default function HowItWorks() {
  const { locale } = useLanguage();
  const [fourSteps, setFourSteps] = useState(defaultFourSteps);
  const [forParentsSteps, setForParentsSteps] = useState(defaultForParentsSteps);
  const [forStudentsSteps, setForStudentsSteps] = useState(defaultForStudentsSteps);
  const [forTeachersSteps, setForTeachersSteps] = useState(defaultForTeachersSteps);
  const [heroTitle, setHeroTitle] = useState('How It Works');
  const [heroSubtitle, setHeroSubtitle] = useState("From finding a teacher to attending classes—here's your journey with GuruChakra.");

  useEffect(() => {
    fetchPageContent('how-it-works', locale)
      .then((res) => {
        const s = res.sections;
        if (Array.isArray(s.fourSteps) && s.fourSteps.length > 0) setFourSteps(s.fourSteps as typeof defaultFourSteps);
        if (Array.isArray(s.forParentsSteps) && s.forParentsSteps.length > 0) setForParentsSteps(s.forParentsSteps as string[]);
        if (Array.isArray(s.forStudentsSteps) && s.forStudentsSteps.length > 0) setForStudentsSteps(s.forStudentsSteps as string[]);
        if (Array.isArray(s.forTeachersSteps) && s.forTeachersSteps.length > 0) setForTeachersSteps(s.forTeachersSteps as string[]);
        if (s.heroTitle) setHeroTitle(s.heroTitle as string);
        if (s.heroSubtitle) setHeroSubtitle(s.heroSubtitle as string);
      })
      .catch(() => {});
  }, [locale]);
  return (
    <div className="overflow-x-hidden">
      {/* Hero - no image, aligned like About/Contact */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">📱</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>🎯</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              {heroSubtitle}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content - cards */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-6 sm:space-y-8">
          {/* Four simple steps */}
          <ScrollReveal variant="fade-up" delay={0}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Four simple steps to start learning
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {fourSteps.map((item, i) => {
              const Icon = ICONS[i];
              const gradients = [
                'from-brand-50 via-white to-accent-50/50',
                'from-accent-50/50 via-white to-brand-50',
                'from-brand-50/80 via-white to-accent-50/60',
                'from-accent-50/60 via-white to-brand-50/80',
              ];
              return (
                <ScrollReveal key={i} variant="fade-up" delay={i * 50}>
                  <div className={`card-funky group relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br ${gradients[i]} p-6 shadow-lg transition hover:shadow-xl sm:p-8`}>
                    <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-25 animate-float sm:text-6xl" style={{ animationDelay: `${i * 0.2}s` }}>
                      {item.icon ?? ['👤', '📱', '📚', '📈'][i]}
                    </div>
                    <div className="relative">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 transition group-hover:scale-110">
                        {Icon && <Icon className="h-7 w-7" />}
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{item.title}</h3>
                      <p className="mt-2 text-base text-gray-700 sm:text-lg">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* For Parents */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-50/40 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:right-10 sm:top-10 sm:text-7xl" style={{ animationDelay: '0.3s' }}>👨‍👩‍👧</div>
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                  For Parents
                </h2>
                <ol className="mt-4 space-y-3 text-base text-gray-700 sm:text-lg">
                  {forParentsSteps.map((step, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/for-parents"
                  className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Learn more for parents
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* For Students */}
          <ScrollReveal variant="fade-up" delay={150}>
            <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50/70 via-white to-brand-50/50 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:text-7xl" style={{ animationDelay: '0.4s' }}>👩‍🎓</div>
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                  For Students
                </h2>
                <ol className="mt-4 space-y-3 text-base text-gray-700 sm:text-lg">
                  {forStudentsSteps.map((step, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-600">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/for-students"
                  className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Learn more for students
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* For Teachers */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-100/40 via-white to-accent-100/40 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:text-7xl" style={{ animationDelay: '0.5s' }}>👨‍🏫</div>
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                  For Teachers
                </h2>
                <ol className="mt-4 space-y-3 text-base text-gray-700 sm:text-lg">
                  {forTeachersSteps.map((step, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{j + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/for-teachers"
                  className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Learn more for teachers
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={250}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  Home
                </Link>
                <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Features
                </Link>
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  About Us
                </Link>
                <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Contact Us
                </Link>
                <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  FAQ
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
