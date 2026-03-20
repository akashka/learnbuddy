import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';

interface Profile {
  name?: string;
  studentId?: string;
  classLevel?: string;
  board?: string;
}

const STUDENT_MENU = [
  { href: '/student/courses', icon: '📚', title: 'My Courses', desc: 'View your enrolled courses & schedule' },
  { href: '/student/classes', icon: '📅', title: 'Classes', desc: 'Upcoming classes, start class, past recordings' },
  { href: '/student/exams', icon: '📝', title: 'Exams', desc: 'Take AI-based exams to get ahead' },
  { href: '/student/study', icon: '📚', title: 'Study Materials', desc: 'AI-based resources & materials' },
];

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchProfile = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Profile>('/api/student/profile')
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchProfile} fullPage />;

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👦"
        title={`${t('welcome')}, ${profile?.name || profile?.studentId || t('student')}!`}
        subtitle="Your learning dashboard"
      />

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {STUDENT_MENU.map((item, idx) => (
          <Link
            key={item.href}
            to={item.href}
            className="card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg transition-all duration-300 hover:border-brand-300 hover:shadow-xl"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-200/20 blur-xl" />
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-brand-200/15 blur-lg" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200 text-2xl shadow-md">
                {item.icon}
              </div>
              <div>
                <h2 className="font-bold text-brand-800">{item.title}</h2>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-200/20 blur-xl" />
        <h3 className="relative mb-2 font-bold text-amber-800">🤖 AI Class Monitoring</h3>
        <p className="relative text-sm text-gray-600">
          During class: Camera and mic must be on. AI checks face match, presence, no extra person, no foul language.
          Violations trigger warnings and admin alerts.
        </p>
      </div>
    </div>
  );
}
