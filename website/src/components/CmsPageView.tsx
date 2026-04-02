import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useWebsiteSettings } from '@/contexts/WebsiteSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchCmsPage } from '@/lib/api';
import { AppDownload } from './AppDownload';
import { SocialLinks } from './SocialLinks';
import { ScrollReveal } from './ScrollReveal';

interface CmsPageViewProps {
  slug: string;
  links?: { to: string; label: string }[];
  showAppDownload?: boolean;
  showSocialLinks?: boolean;
}

const slugImages: Record<string, string> = {
  'for-parents': '/images/parent-student-progress.png',
  'for-students': '/images/kids-learning-home.png',
  'for-teachers': '/images/teacher-online.png',
  'features': '/images/hero-learning.png',
  'how-it-works': '/images/connection-diagram.png',
  'about-us': '/images/hero-learning.png',
  'contact-us': '/images/hero-learning.png',
  'faq': '/images/ai-monitoring-screen.png',
};

export function CmsPageView({ slug, links = [], showAppDownload, showSocialLinks }: CmsPageViewProps) {
  const websiteSettings = useWebsiteSettings();
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCmsPage(slug, locale)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load page'))
      .finally(() => setLoading(false));
  }, [slug, locale]);

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

  const heroImage = slugImages[slug];

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-50/50 px-6 py-12 sm:px-8 sm:py-20 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <ScrollReveal variant="fade-up" className="flex-1">
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
                {page.title}
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Everything you need to know about {page.title.toLowerCase()}.
              </p>
            </ScrollReveal>
            {heroImage && (
              <ScrollReveal variant="scale" delay={100} className="flex justify-center lg:justify-end">
                <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white shadow-lg">
                  <img
                    src={heroImage}
                    alt=""
                    className="h-48 w-72 object-cover object-center sm:h-56 sm:w-80"
                  />
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-10">
          <ScrollReveal variant="fade-up">
            <article
              className="cms-content prose prose-lg prose-indigo max-w-none rounded-2xl border border-brand-100 bg-white p-8 shadow-sm sm:p-10"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </ScrollReveal>

          {/* Social links */}
          {showSocialLinks && (
            <ScrollReveal variant="fade-up" delay={100} className="mt-12">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
                <h3 className="font-display text-lg font-bold text-brand-900">Connect with us</h3>
                <div className="mt-4">
                  <SocialLinks settings={websiteSettings} />
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Related links */}
          {links.length > 0 && (
            <ScrollReveal variant="fade-up" delay={showSocialLinks ? 150 : 100} className="mt-12">
              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6">
                <h3 className="font-display text-lg font-bold text-brand-900">Explore more</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/"
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Home
                  </Link>
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {showAppDownload && (
            <ScrollReveal variant="fade-up" delay={showSocialLinks || links.length > 0 ? 200 : 150} className="mt-16">
              <AppDownload />
            </ScrollReveal>
          )}
        </div>
      </section>
    </div>
  );
}
