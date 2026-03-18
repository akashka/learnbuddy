import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPageContent } from '@/lib/api';
import { TrustBadges } from '@/components/TrustBadges';

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
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
      <section className="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-8 shadow-xl md:p-12">
        <h1 className="mb-3 text-4xl font-extrabold text-brand-900 md:text-5xl">{heroTitle}</h1>
        <p className="text-xl text-gray-600">{heroSubtitle}</p>
        <TrustBadges variant="inline" className="mt-6" />
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-brand-900 md:text-3xl">Safety & Compliance</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {safetyFeatures.map((item, i) => (
            <div key={i} className="rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 shadow-lg">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100/50 text-3xl">{item.icon}</div>
              <h3 className="text-xl font-bold text-brand-900">{item.title}</h3>
              <p className="mt-2 text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-brand-900 md:text-3xl">AI-Powered Learning</h2>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-lg">
            <img src={aiImage} alt="AI monitoring" className="h-64 w-full object-contain sm:h-72" />
          </div>
          <div className="space-y-4">
            {aiFeatures.map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50 p-5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 text-2xl shadow-sm">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-brand-900">{item.title}</h3>
                  <p className="mt-1 text-gray-700">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-brand-900 md:text-3xl">Platform Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {platformFeatures.map((item, i) => (
            <div key={i} className={`rounded-2xl border-2 p-6 shadow-lg ${i % 2 === 0 ? 'border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50/30' : 'border-accent-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50'}`}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">{item.icon}</div>
              <h3 className="font-bold text-brand-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50/50 p-6">
        <h3 className="text-xl font-bold text-brand-900">Explore more</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Home</Link>
          <Link to="/how-it-works" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">How It Works</Link>
          <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">About Us</Link>
          <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">Contact Us</Link>
          <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">FAQ</Link>
        </div>
      </section>
    </div>
  );
}
