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
import { TeacherRecommendationsCarousel } from '@/components/dashboard/TeacherRecommendationsCarousel';

interface DashboardData {
  profile: { name?: string; email?: string };
  checklist: { id: string; label: string; done: boolean; href: string; cta: string }[];
  pendingActions: { type: string; title: string; message: string; href: string; count?: number }[];
  smartNotifications: { type: string; title: string; message: string; href: string; priority?: string }[];
  bestTeachers: {
    teacherId: string;
    name: string;
    photoUrl?: string;
    matchReason: string;
    matchedSubjects: string[];
  }[];
  kids: {
    studentMongoId: string;
    studentId: string;
    name: string;
    board: string;
    classLevel: string;
    stats: {
      classesDone: number;
      examsTaken: number;
      avgScore: number;
      courseMaterialGenerated: number;
      doubtsAnswered: number;
    };
    chartData: { label: string; value: number; color?: string }[];
    aiInsights: { performanceSummary: string; suggestions: string[] };
  }[];
  stats: {
    activeEnrollments: number;
    totalClassesDone: number;
    totalExamsTaken: number;
    avgScore: number;
    totalCourseMaterialGenerated: number;
    totalDoubtsAnswered: number;
  };
  metrics?: {
    performanceSummary?: string;
    suggestions?: string[];
    chartData?: { label: string; value: number; color?: string }[];
  };
  quickLinks: { href: string; icon: string; label: string }[];
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [selectedKidMongoId, setSelectedKidMongoId] = useState<string>('');
  const { t } = useLanguage();

  const fetchData = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<DashboardData>('/api/parent/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!data) return;
    if (!selectedKidMongoId && data.kids.length > 0) {
      setSelectedKidMongoId(data.kids[0].studentMongoId);
    }
  }, [data, selectedKidMongoId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-brand-600">Loading your dashboard...</p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={fetchData} fullPage />;
  if (!data) return null;

  const hasIncompleteTodo = data.checklist.some((c) => !c.done);

  return (
    <div className="mx-auto w-full max-w-7xl animate-fade-in px-4 sm:px-6 lg:px-8" style={{ marginTop: "-2%" }}>
      {/* Hero header - full width gradient */}
      <div className="relative -mx-4 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 px-6 py-10 shadow-2xl sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
            {t('welcome')}, {data.profile?.name || t('parent')}! 👋
          </h1>
          <p className="mt-2 text-lg text-white/90">Manage your kids&apos; learning journey</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Pending actions - prominent */}
        <PendingActions actions={data.pendingActions} />

        {/* Smart notifications */}
        {data.smartNotifications.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg">
            <SmartNotifications notifications={data.smartNotifications} />
          </div>
        )}

        {/* To-do list - accordion */}
        {data.checklist.length > 0 && (
          <AccordionSection
            title="To-do list"
            icon="📋"
            defaultOpen={hasIncompleteTodo}
          >
            <ul className="space-y-3">
              {data.checklist.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-4 rounded-xl p-4 ${item.done ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}
                >
                  <span className="flex items-center gap-3 font-medium text-brand-800">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.done ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                      {item.done ? '✓' : '○'}
                    </span>
                    {item.label}
                  </span>
                  <Link
                    to={item.href}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${item.done ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300' : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                  >
                    {item.cta}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        {/* Quick links */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-800">
            <span>🔗</span> Quick links
          </h2>
          <QuickLinks links={data.quickLinks} />
        </div>

        {/* Best teacher recommendations */}
        {data.bestTeachers.length > 0 && (
          <div>
            <TeacherRecommendationsCarousel teachers={data.bestTeachers} />
          </div>
        )}

        {/* Overall stats */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-brand-800">
            <span>📊</span> Parent overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="📚" label="Active enrollments" value={data.stats.activeEnrollments} gradient="from-brand-500 to-violet-600" />
            <StatCard icon="✅" label="Classes done" value={data.stats.totalClassesDone} gradient="from-emerald-500 to-teal-600" />
            <StatCard icon="📝" label="Exams taken" value={data.stats.totalExamsTaken} gradient="from-amber-500 to-orange-600" />
            <StatCard icon="⭐" label="Avg score" value={data.stats.avgScore + '%'} gradient="from-rose-500 to-pink-600" subtext="Across kids" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <StatCard icon="📚" label="Course material generated" value={data.stats.totalCourseMaterialGenerated} gradient="from-indigo-500 to-blue-600" />
            <StatCard icon="💡" label="Doubts answered" value={data.stats.totalDoubtsAnswered} gradient="from-fuchsia-500 to-pink-600" />
          </div>
        </div>

        {/* Kids performance (switchable) */}
        {data.kids.length > 0 && (
          (() => {
            const selectedKid =
              data.kids.find((k) => k.studentMongoId === selectedKidMongoId) || data.kids[0];

            return (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-brand-800">
                    <span>🧒</span> Kids performance
                  </h2>
                  <div className="flex w-full gap-2 overflow-x-auto pb-1">
                    {data.kids.map((k) => {
                      const active = k.studentMongoId === selectedKidMongoId;
                      return (
                        <button
                          key={k.studentMongoId}
                          type="button"
                          onClick={() => setSelectedKidMongoId(k.studentMongoId)}
                          className={`whitespace-nowrap rounded-2xl border-2 px-4 py-2 text-sm font-bold transition ${active
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300'
                            }`}
                        >
                          {k.name} · {k.classLevel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon="✅" label="Classes done" value={selectedKid.stats.classesDone} gradient="from-emerald-500 to-teal-600" />
                  <StatCard icon="📝" label="Exams taken" value={selectedKid.stats.examsTaken} gradient="from-amber-500 to-orange-600" />
                  <StatCard icon="⭐" label="Avg score" value={selectedKid.stats.avgScore + '%'} gradient="from-rose-500 to-pink-600" />
                  <StatCard icon="📚" label="Materials generated" value={selectedKid.stats.courseMaterialGenerated} gradient="from-indigo-500 to-blue-600" />
                </div>

                {selectedKid.chartData.length > 0 && (
                  <div className="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-lg">
                    <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-800">
                      <span>📈</span> Exam score trend
                    </h3>
                    <SimpleBarChart data={selectedKid.chartData} height={34} />
                  </div>
                )}

                <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-white to-brand-50/50 p-6 shadow-lg">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-brand-800">
                    <span>🤖</span> AI guidance
                  </h3>
                  <p className="text-brand-700">{selectedKid.aiInsights.performanceSummary}</p>
                  <ul className="mt-4 space-y-2">
                    {selectedKid.aiInsights.suggestions.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-brand-600">
                        <span className="text-amber-500">•</span> {s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-sm text-brand-600">
                    Tip: open <Link to="/parent/students" className="font-bold underline">Student Details</Link> to see more for each kid.
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
