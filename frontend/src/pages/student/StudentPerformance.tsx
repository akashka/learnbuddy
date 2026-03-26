import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';

interface ChartDataPoint { label: string; value: number; color?: string; }
interface SubjectBreakdown { subject: string; avgScore: number; examCount: number; trend?: string; }
interface RecentExam { _id: string; subject?: string; score?: number; total?: number; createdAt?: string; }

interface PerformanceData {
  stats: {
    totalClasses: number;
    completedClasses: number;
    missedClasses: number;
    scheduledClasses: number;
    alertsCount: number;
    examsTaken: number;
    avgScore: number;
    highestScore: number;
    doubtsAsked: number;
    resourcesGenerated: number;
  };
  chartData: ChartDataPoint[];
  subjectBreakdown: SubjectBreakdown[];
  recentExams: RecentExam[];
  aiMetrics?: {
    performanceSummary?: string;
    suggestions?: string[];
    estimates?: { label: string; value: string; trend?: 'up' | 'down' | 'stable' }[];
    guidance?: string[];
    chartData?: ChartDataPoint[];
  } | null;
}

function MiniBarChart({ data }: { data: ChartDataPoint[] }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 text-center py-4">No data yet</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-center gap-2 h-36 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1 min-w-0">
          <span className="text-[10px] font-bold" style={{ color: d.color || '#6366f1' }}>{d.value}%</span>
          <div
            className="w-full rounded-t-lg transition-all duration-700"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              backgroundColor: d.color || '#6366f1',
              minHeight: '4px',
            }}
          />
          <span className="text-[9px] text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatTile({ icon, label, value, gradient, note }: { icon: string; label: string; value: string | number; gradient: string; note?: string }) {
  return (
    <div className={`card-funky relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg`}>
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10 blur-xl" />
      <div className="relative">
        <div className="mb-2 text-3xl">{icon}</div>
        <p className="text-2xl font-black text-white drop-shadow">{value}</p>
        <p className="text-xs font-semibold text-white/90 mt-0.5">{label}</p>
        {note && <p className="text-[10px] text-white/70 mt-1">{note}</p>}
      </div>
    </div>
  );
}

function ScoreBadge({ score, total }: { score?: number; total?: number }) {
  const pct = total && score != null ? Math.round((score / total) * 100) : score ?? 0;
  const color = pct >= 80 ? 'from-emerald-400 to-teal-500' : pct >= 60 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';
  return (
    <span className={`rounded-full bg-gradient-to-r ${color} px-3 py-1 text-xs font-black text-white shadow`}>
      {score}{total ? `/${total}` : '%'}
    </span>
  );
}

const AIBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
    <span className="text-base">🤖</span> AI Prediction — verify or consult your teacher
  </span>
);

export default function StudentPerformance() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<PerformanceData>('/api/student/performance')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-fuchsia-200 opacity-75" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 text-5xl shadow-xl">
            🏆
          </div>
        </div>
        <p className="text-xl font-bold text-fuchsia-700">Calculating your superpowers... ⚡</p>
        <p className="text-fuchsia-500">Loading your performance data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <div className="text-5xl mb-3">😥</div>
          <p className="text-red-600 font-semibold">Oops! Could not load performance: {error}</p>
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in px-4 py-6 sm:px-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-500 via-violet-500 via-purple-600 to-indigo-600 px-6 py-10 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl animate-float" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-pink-400/20 blur-xl" />
        {[
          { emoji: '⭐', style: { left: '8%', top: '15%', fontSize: '2.5rem', opacity: 0.25, animationDelay: '0s' } },
          { emoji: '🚀', style: { right: '10%', top: '12%', fontSize: '2rem', opacity: 0.2, animationDelay: '1s' } },
          { emoji: '📊', style: { left: '40%', bottom: '10%', fontSize: '1.8rem', opacity: 0.2, animationDelay: '1.5s' } },
          { emoji: '🎯', style: { right: '25%', bottom: '8%', fontSize: '2.2rem', opacity: 0.2, animationDelay: '0.5s' } },
        ].map((item, i) => (
          <div key={i} className="absolute animate-float" style={item.style}>{item.emoji}</div>
        ))}
        <div className="relative text-center">
          <h1 className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">My Performance 🏆</h1>
          <p className="mt-2 text-lg font-semibold text-white/90">Track your learning journey, celebrate every win!</p>
        </div>
      </div>

      {/* Stats Grid */}
      {s && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-fuchsia-800">
            <span>📊</span> Your Numbers
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile icon="🏫" label="Classes Attended" value={s.completedClasses} gradient="from-fuchsia-500 to-pink-600" note={`of ${s.totalClasses} total`} />
            <StatTile icon="⚠️" label="Alerts in Class" value={s.alertsCount} gradient="from-amber-500 to-orange-500" note="AI proctoring" />
            <StatTile icon="📝" label="Exams Taken" value={s.examsTaken} gradient="from-violet-500 to-purple-600" />
            <StatTile icon="⭐" label="Avg Score" value={`${s.avgScore}%`} gradient="from-emerald-500 to-teal-500" note={`Best: ${s.highestScore}%`} />
            <StatTile icon="❓" label="Doubts Asked" value={s.doubtsAsked} gradient="from-indigo-500 to-blue-600" note={`${s.resourcesGenerated} resources`} />
          </div>
        </div>
      )}

      {/* Score Chart */}
      {data?.chartData && data.chartData.length > 0 && (
        <div className="rounded-3xl border-4 border-fuchsia-200 bg-white p-6 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-fuchsia-800">
            <span>📈</span> Exam Score Trend
          </h2>
          <MiniBarChart data={data.chartData} />
          <p className="mt-3 text-center text-xs text-gray-400">Your last {data.chartData.length} exams</p>
        </div>
      )}

      {/* Subject Breakdown */}
      {data?.subjectBreakdown && data.subjectBreakdown.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-fuchsia-800">
            <span>📚</span> Subject Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.subjectBreakdown.map((sb, i) => {
              const gradients = [
                'from-fuchsia-500 to-pink-500',
                'from-violet-500 to-purple-500',
                'from-indigo-500 to-blue-500',
                'from-emerald-500 to-teal-500',
                'from-amber-500 to-orange-500',
              ];
              const g = gradients[i % gradients.length];
              const pct = Math.min(sb.avgScore, 100);
              return (
                <div key={sb.subject} className="card-funky rounded-2xl border-2 border-fuchsia-100 bg-white p-5 shadow-md">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-bold text-fuchsia-900 text-sm">{sb.subject}</p>
                    <span className="text-lg">{sb.trend === 'up' ? '📈' : '📊'}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-fuchsia-50 overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${g} transition-all duration-1000`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Avg: <strong className="text-fuchsia-700">{sb.avgScore}%</strong></span>
                    <span>{sb.examCount} exam{sb.examCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Exams */}
      {data?.recentExams && data.recentExams.length > 0 && (
        <div className="rounded-3xl border-4 border-fuchsia-200 bg-white p-6 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-fuchsia-800">
            <span>📝</span> Recent Exams
          </h2>
          <div className="space-y-3">
            {data.recentExams.map((exam) => (
              <Link
                key={exam._id}
                to={`/student/exams/${exam._id}`}
                className="flex items-center justify-between rounded-2xl border-2 border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-pink-50 px-4 py-3.5 transition hover:border-fuchsia-300 hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-fuchsia-900">{exam.subject || 'Exam'}</p>
                  {exam.createdAt && (
                    <p className="text-xs text-gray-500">
                      {new Date(exam.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <ScoreBadge score={exam.score} total={exam.total} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Class Insights */}
      {s && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { emoji: '✅', label: 'Completed', value: s.completedClasses, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
            { emoji: '⏭️', label: 'Missed / Cancelled', value: s.missedClasses, color: 'bg-red-50 border-red-200 text-red-800' },
            { emoji: '📆', label: 'Upcoming', value: s.scheduledClasses, color: 'bg-blue-50 border-blue-200 text-blue-800' },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border-2 p-5 text-center shadow-sm ${item.color}`}>
              <div className="text-4xl mb-2">{item.emoji}</div>
              <div className="text-2xl font-black">{item.value}</div>
              <div className="text-sm font-semibold">{item.label} classes</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Metrics Section */}
      {data?.aiMetrics && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-purple-800">🤖 AI Insights</h2>
            <AIBadge />
          </div>

          <div className="rounded-3xl border-4 border-purple-200 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 p-6 shadow-lg">
            {data.aiMetrics.performanceSummary && (
              <div className="mb-5">
                <h3 className="mb-2 text-lg font-black text-purple-800">💭 AI Analysis</h3>
                <p className="text-purple-700 leading-relaxed">{data.aiMetrics.performanceSummary}</p>
              </div>
            )}

            {data.aiMetrics.estimates && data.aiMetrics.estimates.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-3 text-lg font-black text-purple-800">📊 Estimated Outcomes</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.aiMetrics.estimates.map((est, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm border border-purple-100">
                      <span className="font-semibold text-purple-800 text-sm">{est.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-purple-600">{est.value}</span>
                        <span>{est.trend === 'up' ? '📈' : est.trend === 'down' ? '📉' : '➡️'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.aiMetrics.suggestions && data.aiMetrics.suggestions.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-3 text-lg font-black text-purple-800">✨ What to Improve</h3>
                <ul className="space-y-2">
                  {data.aiMetrics.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-purple-700">
                      <span className="text-xl">💡</span>
                      <span className="text-sm font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.aiMetrics.guidance && data.aiMetrics.guidance.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-black text-purple-800">🗺️ Focus Areas</h3>
                <ul className="space-y-2">
                  {data.aiMetrics.guidance.map((g, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/60 px-4 py-3 text-purple-700">
                      <span className="text-xl">🎯</span>
                      <span className="text-sm font-medium">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-purple-200 bg-white/50 p-3 text-center">
              <p className="text-xs text-purple-600">
                🤖 These insights are AI-generated based on your historical data and are updated periodically by our system.
                They are predictions — please discuss with your teacher or parent to verify and plan accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No AI metrics placeholder */}
      {!data?.aiMetrics && (
        <div className="rounded-3xl border-4 border-dashed border-purple-200 bg-purple-50 p-8 text-center">
          <div className="text-5xl mb-3 animate-float">🤖</div>
          <p className="text-lg font-bold text-purple-700">AI Insights Coming Soon!</p>
          <p className="text-sm text-purple-500 mt-1">
            Our AI is analysing your performance. Check back after a few more classes and exams!
          </p>
        </div>
      )}

      {/* Motivational footer */}
      <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center shadow-lg">
        <div className="text-4xl mb-2 animate-bounce-subtle">🚀</div>
        <p className="text-lg font-bold text-amber-800">You&apos;re doing amazing!</p>
        <p className="text-sm text-amber-600 mt-1">
          Every exam, every class, every question brings you closer to your dream. Keep going! 💪
        </p>
      </div>
    </div>
  );
}
