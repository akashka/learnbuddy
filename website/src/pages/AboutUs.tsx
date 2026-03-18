import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLandingData, type LandingData } from '@/lib/api';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SocialLinks } from '@/components/SocialLinks';
import { useWebsiteSettings } from '@/contexts/WebsiteSettingsContext';

const sectionIcons: Record<string, string> = {
  who: '👥',
  vision: '🎯',
  mission: '🚀',
  values: '💎',
  why: '✨',
  contact: '📧',
};

export default function AboutUs() {
  const websiteSettings = useWebsiteSettings();
  const [data, setData] = useState<LandingData | null>(null);

  useEffect(() => {
    fetchLandingData().then(setData).catch(() => setData(null));
  }, []);

  const company = data?.company;
  if (!company) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-brand-100" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-brand-100" />
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'who',
      title: 'Who We Are',
      content: company.descriptionLong ?? company.descriptionShort,
      bg: 'from-brand-50 via-white to-accent-50/40',
      border: 'border-brand-100',
      icon: '👥',
    },
    {
      id: 'vision',
      title: 'Our Vision',
      content: company.vision,
      bg: 'from-brand-600/15 via-brand-50/30 to-accent-500/15',
      border: 'border-brand-200',
      icon: '🎯',
    },
    {
      id: 'mission',
      title: 'Our Mission',
      content: company.mission,
      bg: 'from-accent-50/70 via-white to-brand-50/50',
      border: 'border-accent-100',
      icon: '🚀',
    },
    {
      id: 'values',
      title: 'Our Values',
      content: company.values,
      bg: 'from-brand-100/40 via-white to-accent-100/40',
      border: 'border-brand-200',
      icon: '💎',
      isList: true,
    },
    {
      id: 'why',
      title: 'Why Choose Us',
      content: company.differentiators,
      bg: 'from-accent-100/50 via-white to-brand-100/50',
      border: 'border-accent-200',
      icon: '✨',
      isDiff: true,
    },
    {
      id: 'contact',
      title: 'Get in Touch',
      content: company.contact,
      bg: 'from-brand-200/30 via-white to-accent-200/30',
      border: 'border-brand-200',
      icon: '📧',
      isContact: true,
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero - reduced padding for less gap */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">👥</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>🎯</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              About Us
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              {company.descriptionShort}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content - cards */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-6 sm:space-y-8">
          {cards.map((card, i) => (
            <ScrollReveal key={card.id} variant="fade-up" delay={i * 50}>
              <div
                className={`card-funky relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${card.bg} ${card.border} p-6 shadow-lg transition hover:shadow-xl sm:p-8`}
              >
                <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:right-10 sm:top-10 sm:text-7xl md:text-8xl" style={{ animationDelay: `${i * 0.2}s` }}>
                  {card.icon}
                </div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                    {card.title}
                  </h2>
                  {card.isList && Array.isArray(card.content) ? (
                    <ul className="mt-4 space-y-2 text-base text-gray-700 sm:text-lg">
                      {(card.content as { name: string; description: string }[]).map((v, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="font-semibold text-brand-700">{v.name}:</span>
                          <span>{v.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : card.isDiff && Array.isArray(card.content) ? (
                    <ul className="mt-4 space-y-2 text-base text-gray-700 sm:text-lg">
                      {(card.content as string[]).map((d, j) => {
                        const [title, desc] = d.split(' — ');
                        return (
                          <li key={j} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                            <span className="font-semibold text-brand-700">{title}:</span>
                            <span>{desc}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : card.isContact && typeof card.content === 'object' ? (
                    <div className="mt-4 space-y-2 text-base text-gray-700 sm:text-lg">
                      <p>
                        <strong>Email:</strong>{' '}
                        <a href={`mailto:${(card.content as { email: string }).email}`} className="text-brand-600 hover:underline">
                          {(card.content as { email: string }).email}
                        </a>
                      </p>
                      <p><strong>Hours:</strong> {(card.content as { hours: string }).hours}</p>
                      <p><strong>Response:</strong> {(card.content as { responseTime: string }).responseTime}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-base text-gray-700 sm:text-lg">{card.content as string}</p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}

          {/* Connect & Explore */}
          <div className="grid gap-6 sm:grid-cols-2">
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50/30 p-6">
                <h3 className="font-display text-xl font-bold text-brand-900">Connect with us</h3>
                <div className="mt-4">
                  <SocialLinks settings={websiteSettings} />
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
                <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                    Home
                  </Link>
                  <Link to="/our-team" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                    Our Team
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
        </div>
      </section>
    </div>
  );
}
