import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTeam, type TeamMember } from '@/lib/api';
import { ScrollReveal } from '@/components/ScrollReveal';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const DEPT_ICONS: Record<string, string> = {
  engineering: '⚙️',
  product: '🚀',
  design: '🎨',
  marketing: '📣',
  operations: '📋',
  support: '💬',
  default: '✨',
};

function getDeptIcon(department: string): string {
  if (!department) return DEPT_ICONS.default;
  const key = department.toLowerCase().replace(/\s+/g, '');
  return DEPT_ICONS[key] ?? DEPT_ICONS.default;
}

const CARD_GRADIENTS = [
  'from-brand-50 via-white to-accent-50/40',
  'from-accent-50/50 via-white to-brand-50/50',
  'from-brand-50/80 via-white to-accent-50/60',
  'from-accent-50/60 via-white to-brand-50/80',
];

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const avatar = member.photo;
  const initials = getInitials(member.name);
  const deptIcon = getDeptIcon(member.department);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <ScrollReveal variant="fade-up" delay={index * 60}>
      <div className={`card-funky group relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br ${gradient} p-6 shadow-lg transition hover:border-brand-200 hover:shadow-xl sm:p-8`}>
        <div className="relative mb-4">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-200/40 to-accent-200/40 blur-sm opacity-60 transition group-hover:opacity-80" />
          {avatar ? (
            <img
              src={avatar}
              alt={member.name}
              className="relative h-28 w-28 rounded-full object-cover ring-4 ring-white shadow-[0_0_24px_rgba(255,255,255,0.9)] transition duration-300 group-hover:scale-105 sm:h-32 sm:w-32"
            />
          ) : (
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white ring-4 ring-white shadow-[0_0_24px_rgba(255,255,255,0.9)] transition duration-300 group-hover:scale-105 sm:h-32 sm:w-32 sm:text-3xl">
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{member.name}</h3>
        {member.position && (
          <p className="mt-1 text-base font-semibold text-brand-600">{member.position}</p>
        )}
        {member.department && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-gray-700 shadow-sm">
            <span>{deptIcon}</span>
            {member.department}
          </span>
        )}
      </div>
    </ScrollReveal>
  );
}

import { useLanguage } from '@/contexts/LanguageContext';

export default function OurTeam() {
  const { locale } = useLanguage();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTeam(locale)
      .then((data) => setTeam(data.team || []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">👥</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="pointer-events-none absolute right-[25%] bottom-[20%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '1s' }}>🎯</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              Our Team
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              The people behind GuruChakra—passionate about making quality education accessible to every child.
            </p>
            {team.length > 0 && !loading && (
              <p className="mt-4 text-lg font-medium text-brand-600">
                {team.length} {team.length === 1 ? 'person' : 'people'} building the future of learning
              </p>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Mission banner */}
      <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <ScrollReveal variant="fade-up" delay={50}>
            <div className="card-funky overflow-hidden rounded-2xl border-2 border-accent-100 bg-gradient-to-r from-accent-50/70 via-white to-brand-50/70 p-6 shadow-lg sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-8">
                <span className="text-5xl sm:text-6xl">🚀</span>
                <div>
                  <h2 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">
                    We&apos;re on a mission
                  </h2>
                  <p className="mt-1 text-gray-600">
                    Every child deserves a learning buddy. We&apos;re building it—together.
                  </p>
                </div>
                <span className="text-5xl sm:text-6xl">📚</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Team grid */}
      <section className="px-4 pt-8 pb-4 sm:px-6 sm:pt-12 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Meet the team
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Curious minds, big hearts, and a shared love for learning.
            </p>
          </ScrollReveal>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border-2 border-brand-100 bg-white p-6">
                  <div className="mx-auto h-28 w-28 rounded-full bg-brand-100 sm:h-32 sm:w-32" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-brand-100" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-brand-100" />
                </div>
              ))}
            </div>
          ) : team.length === 0 ? (
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="card-funky rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/50 to-accent-50/30 p-12 text-center">
                <span className="text-6xl">🌟</span>
                <p className="mt-4 text-lg text-gray-600">No team members to display yet.</p>
                <p className="mt-2 text-sm text-gray-500">Check back soon or visit our Careers page to join us!</p>
                <Link
                  to="/careers"
                  className="btn-funky mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
                >
                  View Careers
                </Link>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {team.map((member, i) => (
                <MemberCard key={i} member={member} index={i} />
              ))}
            </div>
          )}

          {/* CTA card */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="card-funky rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50 p-6 text-center shadow-lg sm:p-8">
              <h3 className="font-display text-2xl font-bold text-brand-900">Want to join our team?</h3>
              <p className="mt-3 text-gray-600">
                We&apos;re always looking for talented people who share our mission.
              </p>
              <Link
                to="/careers"
                className="btn-funky mt-6 inline-block rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700"
              >
                View Open Positions
              </Link>
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
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  About Us
                </Link>
                <Link to="/careers" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Careers
                </Link>
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
