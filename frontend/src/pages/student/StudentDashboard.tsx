import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { AccordionSection } from '@/components/dashboard/AccordionSection';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import { SmartNotifications } from '@/components/dashboard/SmartNotifications';
import { PendingActions } from '@/components/dashboard/PendingActions';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';

interface DashboardData {
  profile: { name?: string; studentId?: string; classLevel?: string };
  checklist: { id: string; label: string; done: boolean; href: string; cta: string }[];
  pendingActions: { type: string; title: string; message: string; href: string }[];
  smartNotifications: { type: string; title: string; message: string; href: string; priority: string }[];
  stats: { courses: number; examsTaken: number; avgScore: number; classesAttended: number };
  metrics?: {
    performanceSummary?: string;
    suggestions?: string[];
    chartData?: { label: string; value: number; color?: string }[];
  };
  quickLinks: { href: string; icon: string; label: string }[];
  upcomingClasses: { _id: string; subject?: string; scheduledAt?: string; teacher?: { name?: string } }[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<DashboardData>('/api/student/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-bounce rounded-full border-4 border-fuchsia-200 border-t-fuchsia-500 bg-gradient-to-br from-fuchsia-100 to-pink-100" />
        <p className="text-lg font-semibold text-fuchsia-700">Loading your space... 🚀</p>
        <p className="text-sm text-fuchsia-600">Get ready for fun learning!</p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;
  if (!data) return null;

  const hasIncompleteTodo = data.checklist.some((c) => !c.done);

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 sm:px-6 lg:px-8" style={{ marginTop: "-2%" }}>
      {/* Kid-friendly hero - rainbow gradient */}
      <div className="relative -mx-4 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-r from-fuchsia-500 via-pink-500 via-purple-500 to-indigo-500 px-6 py-12 shadow-2xl sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-12">
        <div className="absolute inset-0 animate-pulse opacity-20">
          <div className="absolute left-10 top-5 text-6xl">⭐</div>
          <div className="absolute right-20 top-8 text-5xl">🌟</div>
          <div className="absolute bottom-10 left-1/4 text-4xl">📚</div>
          <div className="absolute bottom-8 right-1/3 text-5xl">🎯</div>
        </div>
        <div className="relative text-center sm:text-left">
          <h1 className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
            Hey, {data.profile?.name || data.profile?.studentId || t('student')}! 🎉
          </h1>
          <p className="mt-3 text-xl font-semibold text-white/95">Your learning adventure starts here!</p>
          {data.profile?.classLevel && (
            <p className="mt-1 text-white/80">Class {data.profile.classLevel}</p>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <PendingActions actions={data.pendingActions} />

        {/* Class in 15 min - extra prominent for students */}
        {data.smartNotifications.length > 0 && (
          <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100 p-6 shadow-xl">
            <SmartNotifications notifications={data.smartNotifications} />
          </div>
        )}

        {data.checklist.length > 0 && (
          <AccordionSection title="Your mission" icon="🎯" defaultOpen={hasIncompleteTodo}>
            <ul className="space-y-4">
              {data.checklist.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-4 rounded-2xl p-5 ${item.done ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-gradient-to-r from-fuchsia-50 to-pink-50 border-2 border-fuchsia-200'
                    }`}
                >
                  <span className="flex items-center gap-4 text-lg font-bold">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${item.done ? 'bg-emerald-500 text-white' : 'bg-fuchsia-400 text-white'}`}>
                      {item.done ? '✓' : '○'}
                    </span>
                    {item.label}
                  </span>
                  <Link
                    to={item.href}
                    className={`rounded-xl px-5 py-2.5 text-base font-bold shadow-lg transition hover:scale-105 ${item.done ? 'bg-emerald-400 text-white hover:bg-emerald-500' : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-600 hover:to-pink-600'
                      }`}
                  >
                    {item.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-fuchsia-800">
            <span>🌈</span> Quick links
          </h2>
          <QuickLinks links={data.quickLinks} />
        </div>

        {/* Stats - fun cards for students */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-fuchsia-800">
            <span>📊</span> Your progress
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="📚" label="Courses" value={data.stats.courses} gradient="from-fuchsia-500 to-pink-600" />
            <StatCard icon="📝" label="Exams taken" value={data.stats.examsTaken} gradient="from-violet-500 to-purple-600" />
            <StatCard icon="⭐" label="Avg score" value={data.stats.avgScore + '%'} gradient="from-amber-500 to-yellow-500" />
            <StatCard icon="✅" label="Classes attended" value={data.stats.classesAttended} gradient="from-emerald-500 to-teal-500" />
          </div>
        </div>

        {(data.metrics?.performanceSummary || data.metrics?.chartData?.length) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.metrics.performanceSummary && (
              <div className="rounded-3xl border-4 border-fuchsia-200 bg-gradient-to-br from-white to-fuchsia-50 p-6 shadow-lg">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-fuchsia-800">
                  <span>💡</span> You&apos;re doing great!
                </h3>
                <p className="text-lg text-fuchsia-700">{data.metrics.performanceSummary}</p>
                {data.metrics.suggestions?.length && (
                  <ul className="mt-5 space-y-3">
                    {data.metrics.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-fuchsia-700">
                        <span className="text-2xl">✨</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {data.metrics?.chartData && data.metrics.chartData.length > 0 && (
              <div className="rounded-3xl border-4 border-fuchsia-200 bg-white p-6 shadow-lg">
                <h3 className="mb-4 font-bold text-fuchsia-800">📈 Your scores</h3>
                <SimpleBarChart data={data.metrics.chartData} height={40} />
              </div>
            )}
          </div>
        )}

        {data.upcomingClasses.length > 0 && (
          <div className="rounded-3xl border-4 border-fuchsia-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-fuchsia-800">
              <span>📅</span> Next classes
            </h3>
            <div className="space-y-3">
              {data.upcomingClasses.map((c) => (
                <Link
                  key={c._id}
                  to="/student/classes"
                  className="flex items-center justify-between rounded-2xl border-2 border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-pink-50 px-5 py-4 transition hover:border-fuchsia-300 hover:shadow-md"
                >
                  <span className="font-bold text-fuchsia-800">{c.subject}</span>
                  <span className="rounded-full bg-fuchsia-200 px-4 py-1 text-sm font-semibold text-fuchsia-800">
                    {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Class Monitoring reminder - kid-friendly */}
        <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-lg">
          <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-800">
            <span>🤖</span> Remember for class
          </h3>
          <p className="text-amber-700">
            Camera and mic must be on. AI checks that you&apos;re present and focused. Let&apos;s have a great class! 🎓
          </p>
        </div>
      </div>
    </div>
  );
}
