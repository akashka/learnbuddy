import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { apiJson } from '@/lib/api';
import { ScrollReveal } from './ScrollReveal';

const LEGAL_CONFIG: Record<string, { floatEmojis: string[]; subtitle: string }> = {
  'privacy-policy': {
    floatEmojis: ['🛡️', '📋'],
    subtitle: 'How we collect, use, and protect your data. DPDP compliant.',
  },
  'terms-conditions': {
    floatEmojis: ['📄', '✅'],
    subtitle: 'Terms of service and conditions for using GuruChakra.',
  },
};

interface LegalPageViewProps {
  slug: 'privacy-policy' | 'terms-conditions';
  links: { to: string; label: string }[];
}

export function LegalPageView({ slug, links }: LegalPageViewProps) {
  const config = LEGAL_CONFIG[slug];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

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
      {/* Hero - no image, left-aligned */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">{config.floatEmojis[0]}</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>{config.floatEmojis[1]}</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              {config.subtitle}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8 sm:space-y-12">
          <ScrollReveal variant="fade-up" delay={0}>
            <div className="card-funky overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30 p-6 shadow-lg transition hover:border-brand-200 sm:p-8 lg:p-10">
              <article
                className="cms-content prose prose-lg prose-indigo max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitized }}
              />
            </div>
          </ScrollReveal>

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
                <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Features
                </Link>
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  About Us
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
                <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Contact Us
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
