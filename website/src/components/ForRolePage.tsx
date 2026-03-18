import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { apiJson, fetchPageContent } from '@/lib/api';
import { ScrollReveal } from './ScrollReveal';
import { FeaturedTeachers } from './FeaturedTeachers';

type RoleConfig = {
  image: string;
  emoji: string;
  floatEmojis: string[];
  highlights: { icon: string; title: string; desc: string }[];
  gradient: string;
  border: string;
};

const DEFAULT_ROLE_CONFIG: Record<string, RoleConfig> = {
  'for-parents': {
    image: '/images/parent-student-progress.png',
    emoji: '👨‍👩‍👧',
    floatEmojis: ['🛡️', '📊', '✅'],
    highlights: [
      { icon: '🛡️', title: 'AI Monitored Classes', desc: 'Every session monitored for safety. Peace of mind for you.' },
      { icon: '✅', title: 'Teachers Screened & BGV Checked', desc: 'Background verification and AI qualification for all teachers.' },
      { icon: '📊', title: 'Track Progress', desc: 'View schedules, attendance, and performance in one place.' },
      { icon: '📅', title: 'Flexible Scheduling', desc: 'Reschedule when needed. Easy to manage your child\'s learning.' },
    ],
    gradient: 'from-brand-50 via-white to-accent-50/40',
    border: 'border-brand-100',
  },
  'for-students': {
    image: '/images/kids-learning-home.png',
    emoji: '📚',
    floatEmojis: ['💡', '📝', '📱'],
    highlights: [
      { icon: '💬', title: 'Ask AI Anytime', desc: 'Stuck on a doubt? Get instant help 24/7 with our AI.' },
      { icon: '📝', title: 'AI Moderated Exams', desc: 'Fair evaluation. AI generates and grades—with human review if needed.' },
      { icon: '👤', title: 'One-to-One Attention', desc: 'Your teacher focuses only on you. No crowded classes.' },
      { icon: '📱', title: 'Learn Anywhere', desc: 'Use the app on phone or tablet. Learn from home or anywhere.' },
    ],
    gradient: 'from-accent-50/50 via-white to-brand-50/50',
    border: 'border-accent-100',
  },
  'for-teachers': {
    image: '/images/teacher-online.png',
    emoji: '👩‍🏫',
    floatEmojis: ['💰', '🤖', '📅'],
    highlights: [
      { icon: '✅', title: 'Verified & Trusted', desc: 'BGV check and AI exam build trust. Students come ready to learn.' },
      { icon: '💰', title: 'Fair Commission', desc: 'Transparent 10% commission. Payouts on time, every month.' },
      { icon: '🤖', title: 'AI Tools to Help', desc: 'AI materials, exam questions, doubt resolution. Teach smarter.' },
      { icon: '📅', title: 'Flexible Schedule', desc: 'Create batches that fit your availability. Teach from anywhere.' },
    ],
    gradient: 'from-brand-50/80 via-white to-accent-50/60',
    border: 'border-brand-200',
  },
};

interface ForRolePageProps {
  slug: 'for-parents' | 'for-students' | 'for-teachers';
  links: { to: string; label: string }[];
}

export function ForRolePage({ slug, links }: ForRolePageProps) {
  const [config, setConfig] = useState<RoleConfig>(DEFAULT_ROLE_CONFIG[slug]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    setConfig(DEFAULT_ROLE_CONFIG[slug]);
    fetchPageContent('role-config')
      .then((res) => {
        const rc = res.sections[slug] as RoleConfig | undefined;
        if (rc?.image && rc?.highlights?.length) setConfig(rc);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiJson<{ title: string; content: string }>(`/api/cms-pages/${slug}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-brand-100" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-brand-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-brand-100" />
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-8 lg:px-10">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error || 'Page not found'}</p>
          <Link to="/" className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const sanitized = DOMPurify.sanitize(page.content, {
    ADD_ATTR: ['target', 'rel', 'allow', 'allowfullscreen', 'frameborder'],
    ADD_TAGS: ['iframe'],
  });

  return (
    <div className="overflow-x-hidden">
      {/* Hero with image */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-5xl opacity-20 animate-float sm:text-6xl" style={{ animationDelay: '0.2s' }}>{config.floatEmojis[0]}</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[30%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>{config.floatEmojis[1]}</div>
        <div className="pointer-events-none absolute right-[20%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '1s' }}>{config.floatEmojis[2]}</div>
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <ScrollReveal variant="fade-up" className="flex-1">
              <span className="text-6xl sm:text-7xl" style={{ animationDelay: '0.2s' }}>{config.emoji}</span>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
                {page.title}
              </h1>
              <p className="mt-3 text-xl text-gray-600">
                Everything you need to know about {page.title.toLowerCase()}.
              </p>
            </ScrollReveal>
            <ScrollReveal variant="scale" delay={100} className="flex justify-center lg:justify-end">
              <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-lg">
                <img
                  src={config.image}
                  alt=""
                  className="h-56 w-72 object-cover object-center sm:h-64 sm:w-80"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8 sm:space-y-12">
          {/* Highlight cards */}
          <ScrollReveal variant="fade-up" delay={0}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Why choose LearnBuddy
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.highlights.map((item, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 60}>
                <div className={`card-funky group relative overflow-hidden rounded-2xl border-2 ${config.border} bg-gradient-to-br ${config.gradient} p-6 shadow-lg transition hover:shadow-xl sm:p-8`}>
                  <div className="pointer-events-none absolute right-4 top-4 text-5xl opacity-25 animate-float sm:text-6xl" style={{ animationDelay: `${i * 0.15}s` }}>
                    {item.icon}
                  </div>
                  <div className="relative">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm transition group-hover:scale-110">
                      {item.icon}
                    </div>
                    <h3 className="mt-4 font-display font-bold text-brand-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-gray-700 sm:text-base">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* CMS content */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className={`card-funky overflow-hidden rounded-2xl border-2 ${config.border} bg-white p-6 shadow-lg sm:p-8`}>
              <article
                className="cms-content prose prose-lg prose-indigo max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitized }}
              />
            </div>
          </ScrollReveal>

          {/* Featured Teachers - for parents and for teachers, read-only after content */}
          {(slug === 'for-parents' || slug === 'for-teachers') && (
            <div className="mt-12 sm:mt-16">
              <FeaturedTeachers variant={slug === 'for-parents' ? 'parents' : 'teachers'} limit={6} />
            </div>
          )}

          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/for-you" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  For You
                </Link>
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link to="/" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Home
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
