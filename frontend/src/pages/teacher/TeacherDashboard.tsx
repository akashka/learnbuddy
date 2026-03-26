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
  profile: { name?: string };
  checklist: { id: string; label: string; done: boolean; href: string; cta: string }[];
  pendingActions: { type: string; title: string; message: string; href: string; count?: number }[];
  smartNotifications: { type: string; title: string; message: string; href: string; priority: string }[];
  stats: {
    totalStudents: number;
    earnedThisWeek: number;
    earnedThisMonth: number;
    classesConductedAllTime: number;
    classesConductedThisMonth: number;
  };
  students: {
    studentMongoId: string;
    studentId: string;
    name: string;
    parentName?: string;
    board: string;
    classLevel: string;
    stats: {
      examsTaken: number;
      avgScore: number;
      classesDoneAllTime: number;
      courseMaterialGeneratedThisMonth: number;
      doubtsAnsweredThisMonth: number;
    };
    chartData: { label: string; value: number; color?: string }[];
    aiSuggestions: string[];
  }[];
  aiInsights?: { performanceTip?: string };
  metrics?: {
    performanceSummary?: string;
    suggestions?: string[];
    chartData?: { label: string; value: number; color?: string }[];
  };
  quickLinks: { href: string; icon: string; label: string }[];
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<DashboardData>('/api/teacher/dashboard')
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        <p className="text-sm font-medium text-amber-700">Loading your dashboard...</p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;
  if (!data) return null;

  const hasIncompleteTodo = data.checklist.some((c) => !c.done);

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 sm:px-6 lg:px-8" style={{ marginTop: "-2%" }}>
      {/* Hero header - teacher gradient (amber/gold) */}
      <div className="relative -mx-4 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-10 shadow-2xl sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2h20v2h20v2H20v2.5zM0 20v2h20v2H0v2h20v2h20v-2h20v-2H20v-2H0z\'/%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
            {t('welcome')}, {data.profile?.name || t('teacher')}! 👩‍🏫
          </h1>
          <p className="mt-2 text-lg text-white/90">Your teaching dashboard</p>
        </div>
      </div>

      <div className="space-y-8">
        <PendingActions actions={data.pendingActions} />

        {data.smartNotifications.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg">
            <SmartNotifications notifications={data.smartNotifications} />
          </div>
        )}

        {data.checklist.length > 0 && (
          <AccordionSection title="To-do list" icon="📋" defaultOpen={hasIncompleteTodo}>
            <ul className="space-y-3">
              {data.checklist.map((item) => (
                <li key={item.id} className={`flex items-center justify-between gap-4 rounded-xl p-4 ${item.done ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <span className="flex items-center gap-3 font-medium text-brand-800">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.done ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                      {item.done ? '✓' : '○'}
                    </span>
                    {item.label}
                  </span>
                  <Link to={item.href} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${item.done ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                    {item.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-800">
            <span>🔗</span> Quick links
          </h2>
          <QuickLinks links={data.quickLinks} />
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-800">
            <span>📊</span> Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon="💸" label="Earned this week" value={`₹${data.stats.earnedThisWeek}`} gradient="from-emerald-500 to-teal-600" />
            <StatCard icon="🏦" label="Earned this month" value={`₹${data.stats.earnedThisMonth}`} gradient="from-amber-500 to-orange-600" />
            <StatCard icon="✅" label="Classes done (month)" value={data.stats.classesConductedThisMonth} gradient="from-violet-500 to-purple-600" />
            <StatCard icon="📚" label="Classes done (all-time)" value={data.stats.classesConductedAllTime} gradient="from-brand-500 to-indigo-600" />
            <StatCard icon="👥" label="Students" value={data.stats.totalStudents} gradient="from-rose-500 to-pink-600" />
          </div>
        </div>

        {(data.metrics?.performanceSummary || data.metrics?.chartData?.length) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.metrics.performanceSummary && (
              <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50/50 p-6 shadow-lg">
                <h3 className="mb-3 font-bold text-amber-900">💡 Insights</h3>
                <p className="text-amber-800">{data.metrics.performanceSummary}</p>
                {data.metrics.suggestions?.length && (
                  <ul className="mt-4 space-y-2">
                    {data.metrics.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span>•</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {data.metrics?.chartData && data.metrics.chartData.length > 0 && (
              <div className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-lg">
                <h3 className="mb-4 font-bold text-amber-900">Activity</h3>
                <SimpleBarChart data={data.metrics.chartData} />
              </div>
            )}
          </div>
        )}

        {data.students.length > 0 && (
          <div className="space-y-4">
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-brand-800">
              <span>👩‍🎓</span> Your kids profiles
            </h2>
            <div className="grid gap-4">
              {data.students.map((s) => (
                <AccordionSection key={s.studentMongoId} title={`${s.name} · ${s.classLevel}`} icon="👦" defaultOpen={false}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                      <p className="text-sm font-semibold text-brand-800">Performance</p>
                      <div className="mt-2 space-y-1 text-sm text-brand-700">
                        <div>
                          Exams taken: <span className="font-bold text-brand-900">{s.stats.examsTaken}</span>
                        </div>
                        <div>
                          Avg score: <span className="font-bold text-brand-900">{s.stats.avgScore}%</span>
                        </div>
                        <div>
                          Classes done (all-time): <span className="font-bold text-brand-900">{s.stats.classesDoneAllTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                      <p className="text-sm font-semibold text-brand-800">AI activity</p>
                      <div className="mt-2 space-y-1 text-sm text-brand-700">
                        <div>
                          Materials this month: <span className="font-bold text-brand-900">{s.stats.courseMaterialGeneratedThisMonth}</span>
                        </div>
                        <div>
                          Doubts answered: <span className="font-bold text-brand-900">{s.stats.doubtsAnsweredThisMonth}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {s.chartData.length > 0 && (
                    <div className="mt-4 rounded-xl border border-brand-100 bg-white p-4">
                      <p className="mb-3 text-sm font-semibold text-brand-800">Exam score trend</p>
                      <SimpleBarChart data={s.chartData} height={28} />
                    </div>
                  )}

                  <div className="mt-4 text-sm text-brand-700">
                    <span className="font-bold text-brand-800">AI suggestion:</span> {s.aiSuggestions?.[0] || 'Keep guiding with targeted practice.'}
                  </div>
                </AccordionSection>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
