import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '@/components/ScrollReveal';
import { fetchPageContent } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const defaultSafetyFeatures = [
  { title: 'DPDP Compliant', desc: "Full compliance with India's Digital Personal Data Protection Act. Children's data is protected.", icon: '🛡️', emoji: '🔒' },
  { title: 'AI Monitored Sessions', desc: 'Every class and exam is monitored by AI for safety and quality. Parents get peace of mind with real-time oversight.', icon: '📹', emoji: '🤖' },
  { title: 'Teachers Screened & BGV Checked', desc: 'Background verification for all teachers. AI qualification exam ensures teaching quality and student safety.', icon: '✅', emoji: '👨‍🏫' },
];

const defaultAiFeatures = [
  { title: 'Ask AI Anytime', desc: 'Students get instant help with doubts 24/7. AI-powered study materials and explanations.', icon: '💬', emoji: '💡' },
  { title: 'AI Moderated Exams', desc: 'Fair, unbiased exam generation and evaluation. Human review option for appeals.', icon: '📝', emoji: '📊' },
  { title: 'AI Study Materials', desc: 'Personalized study content generated for each topic.', icon: '📚', emoji: '✨' },
];

const defaultPlatformFeatures = [
  { title: 'One-to-One Tuition', desc: 'Personal attention. No crowded classes.', icon: '👤', emoji: '🎯' },
  { title: 'Mobile App', desc: 'iOS and Android. Learn anywhere, anytime.', icon: '📱', emoji: '📲' },
  { title: 'Secure Payments', desc: 'Pay through the app. Teachers get paid on time.', icon: '💳', emoji: '🔐' },
  { title: 'Reschedule Anytime', desc: 'Flexible class scheduling for students and teachers.', icon: '📅', emoji: '⏰' },
];

export default function Features() {
  const [safetyFeatures, setSafetyFeatures] = useState(defaultSafetyFeatures);
  const [aiFeatures, setAiFeatures] = useState(defaultAiFeatures);
  const [platformFeatures, setPlatformFeatures] = useState(defaultPlatformFeatures);
  const [heroTitle, setHeroTitle] = useState('Features');
  const [heroSubtitle, setHeroSubtitle] = useState('Everything you need for safe, effective, and fun learning—powered by AI and built for trust.');
  const [aiImage, setAiImage] = useState('/images/ai-monitoring.svg');

  useEffect(() => {
    fetchPageContent('features')
      .then((res) => {
        const s = res.sections;
        if (Array.isArray(s.safetyFeatures) && s.safetyFeatures.length > 0) setSafetyFeatures(s.safetyFeatures as typeof defaultSafetyFeatures);
        if (Array.isArray(s.aiFeatures) && s.aiFeatures.length > 0) setAiFeatures(s.aiFeatures as typeof defaultAiFeatures);
        if (Array.isArray(s.platformFeatures) && s.platformFeatures.length > 0) setPlatformFeatures(s.platformFeatures as typeof defaultPlatformFeatures);
        if (s.heroTitle) setHeroTitle(s.heroTitle as string);
        if (s.heroSubtitle) setHeroSubtitle(s.heroSubtitle as string);
        if (s.aiImage) setAiImage(s.aiImage as string);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="overflow-x-hidden">
      {/* Hero - no image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">✨</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>🤖</div>
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

      {/* Content */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8 sm:space-y-12">
          {/* Safety & Compliance */}
          <ScrollReveal variant="fade-up" delay={0}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Safety & Compliance
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-3">
            {safetyFeatures.map((item, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 80}>
                <div className="card-funky group relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50/40 p-6 shadow-lg transition hover:shadow-xl hover:border-brand-200 sm:p-8">
                  <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:text-7xl" style={{ animationDelay: `${i * 0.2}s` }}>
                    {item.emoji}
                  </div>
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100/50 text-3xl transition group-hover:scale-110">
                      {item.icon}
                    </div>
                    <h3 className="mt-4 font-display text-xl font-bold text-brand-900">{item.title}</h3>
                    <p className="mt-2 flex-1 text-base text-gray-700 sm:text-lg">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* AI-Powered Learning - with image */}
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              AI-Powered Learning
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <ScrollReveal variant="slide-right" delay={150}>
              <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-lg">
                <img
                  src={aiImage}
                  alt="AI monitoring and learning"
                  className="h-64 w-full object-contain object-center sm:h-72"
                />
              </div>
            </ScrollReveal>
            <div className="space-y-4">
              {aiFeatures.map((item, i) => (
                <ScrollReveal key={i} variant="fade-up" delay={200 + i * 50}>
                  <div className="card-funky flex items-start gap-4 rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50 p-5 shadow-sm transition hover:shadow-lg">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 text-2xl shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-brand-900">{item.title}</h3>
                      <p className="mt-1 text-gray-700">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Platform Features */}
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Platform Features
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((item, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 60}>
                <div className={`card-funky group relative flex min-h-[200px] flex-col overflow-hidden rounded-2xl border-2 p-6 shadow-lg transition hover:shadow-xl sm:p-8 ${
                  i % 2 === 0
                    ? 'border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50/30'
                    : 'border-accent-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50'
                }`}>
                  <div className="pointer-events-none absolute right-4 top-4 text-5xl opacity-20 animate-float sm:text-6xl" style={{ animationDelay: `${i * 0.15}s` }}>
                    {item.emoji}
                  </div>
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm transition group-hover:scale-110">
                      {item.icon}
                    </div>
                    <h3 className="mt-4 font-display font-bold text-brand-900">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-gray-700 sm:text-base">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  Home
                </Link>
                <Link to="/how-it-works" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  How It Works
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
