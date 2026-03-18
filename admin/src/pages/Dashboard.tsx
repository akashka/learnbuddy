import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi, type PlatformStats } from '@/lib/adminApi';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#f59e0b', '#4f46e5', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-IN').format(n);
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  to,
  color,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  to?: string;
  color?: string;
}) {
  const content = (
    <div
      className={`rounded-xl border-2 bg-white p-5 shadow-sm transition hover:shadow-md ${
        to ? 'cursor-pointer border-accent-200 hover:border-accent-400' : 'border-accent-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-accent-600">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${color || 'text-accent-800'}`}>{value}</p>
          {subValue && <p className="mt-0.5 text-xs text-accent-500">{subValue}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function ActionItemCard({
  title,
  count,
  to,
  icon,
  variant,
}: {
  title: string;
  count: number;
  to: string;
  icon: string;
  variant: 'warning' | 'error' | 'info';
}) {
  const styles =
    variant === 'error'
      ? 'border-red-200 bg-red-50 hover:border-red-400'
      : variant === 'warning'
        ? 'border-amber-200 bg-amber-50 hover:border-amber-400'
        : 'border-blue-200 bg-blue-50 hover:border-blue-400';
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 rounded-xl border-2 p-4 transition ${styles}`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-medium text-accent-800">{title}</p>
        <p className="text-sm text-accent-600">{count} pending</p>
      </div>
      <span className="text-accent-500">→</span>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .stats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!user) return null;

  if (loading && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" />
          <p className="mt-4 text-accent-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { counts, revenue, enrollmentsByDay, revenueByDay, usersByRole, newLast30Days, aiUsageReport } = stats;

  const usersPieData = [
    { name: 'Teachers', value: usersByRole.teachers, color: CHART_COLORS[0] },
    { name: 'Parents', value: usersByRole.parents, color: CHART_COLORS[1] },
    { name: 'Students', value: usersByRole.students, color: CHART_COLORS[2] },
  ].filter((d) => d.value > 0);

  const hasActionItems =
    (counts.pendingEnrollments ?? 0) > 0 ||
    (counts.pendingAiReviews ?? 0) > 0 ||
    (counts.openSecurityIncidents ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-accent-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-accent-800 sm:text-3xl">
            {t('welcome')}, {t('admin')}! 👋
          </h1>
          <p className="mt-1 text-accent-600">Platform metrics and overview</p>
        </header>

        {/* Action items */}
        {hasActionItems && (
          <section className="mb-6 sm:mb-8">
            <h2 className="mb-3 text-lg font-semibold text-accent-800">Action items</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(counts.pendingEnrollments ?? 0) > 0 && (
                <ActionItemCard
                  title="Pending enrollments"
                  count={counts.pendingEnrollments!}
                  to="/enrollments"
                  icon="📚"
                  variant="warning"
                />
              )}
              {(counts.pendingAiReviews ?? 0) > 0 && (
                <ActionItemCard
                  title="AI reviews pending"
                  count={counts.pendingAiReviews!}
                  to="/ai-review-requests"
                  icon="🔍"
                  variant="info"
                />
              )}
              {(counts.openSecurityIncidents ?? 0) > 0 && (
                <ActionItemCard
                  title="Open security incidents"
                  count={counts.openSecurityIncidents!}
                  to="/security-incidents"
                  icon="🔒"
                  variant="error"
                />
              )}
            </div>
          </section>
        )}

        {/* Stats Grid */}
        <section className="mb-8 sm:mb-10">
          <h2 className="mb-4 text-lg font-semibold text-accent-800">Key metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Teachers"
              value={formatNumber(counts.teachers)}
              subValue={`+${newLast30Days.teachers} last 30 days`}
              icon="👩‍🏫"
              to="/teachers"
            />
            <StatCard
              title="Parents"
              value={formatNumber(counts.parents)}
              subValue={`+${newLast30Days.parents} last 30 days`}
              icon="👨‍👩‍👧"
              to="/parents"
            />
            <StatCard
              title="Students"
              value={formatNumber(counts.students)}
              subValue={`+${newLast30Days.students} last 30 days`}
              icon="👦"
              to="/students"
            />
            <StatCard
              title="Enrollments"
              value={formatNumber(counts.enrollments)}
              subValue={`${counts.enrollmentsActive} active · ${counts.pendingEnrollments} pending`}
              icon="📚"
              to="/enrollments"
            />
            <StatCard
              title="Total revenue"
              value={formatCurrency(revenue.total)}
              subValue={`${formatCurrency(revenue.thisMonth)} this month`}
              icon="💰"
              color="text-emerald-700"
            />
            <StatCard
              title="Classes conducted"
              value={formatNumber(counts.classesConducted)}
              subValue={`${counts.classesScheduled} scheduled`}
              icon="📅"
              to="/classes"
            />
            {aiUsageReport && (
              <StatCard
                title="AI calls (30d)"
                value={formatNumber(aiUsageReport.totalCalls)}
                subValue={`${aiUsageReport.successRate}% success · ${aiUsageReport.failedCount} failed`}
                icon="🤖"
                to="/ai-usage-logs"
              />
            )}
          </div>
        </section>

        {/* AI Usage Reports */}
        {aiUsageReport && aiUsageReport.totalCalls > 0 && (
          <section className="mb-8 sm:mb-10">
            <h2 className="mb-4 text-lg font-semibold text-accent-800">AI usage report (last 30 days)</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 font-medium text-accent-800">AI calls by operation type</h3>
                <div className="h-64">
                  {aiUsageReport.byOperationType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={aiUsageReport.byOperationType.map((d) => ({
                          name: d.operationType.replace(/_/g, ' ').slice(0, 20),
                          count: d.count,
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-accent-500">No data</div>
                  )}
                </div>
              </div>
              <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 font-medium text-accent-800">AI calls over time</h3>
                <div className="h-64">
                  {aiUsageReport.callsByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={aiUsageReport.callsByDay}
                        margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="aiCallsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#aiCallsGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-accent-500">No data</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link
                to="/ai-usage-logs"
                className="text-sm font-medium text-accent-600 hover:text-accent-800 hover:underline"
              >
                View all AI usage logs →
              </Link>
            </div>
          </section>
        )}

        {/* Charts */}
        <section className="mb-8 sm:mb-10">
          <h2 className="mb-4 text-lg font-semibold text-accent-800">Charts</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 font-medium text-accent-800">Enrollments (last 30 days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={enrollmentsByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="url(#enrollGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 font-medium text-accent-800">Revenue (last 30 days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(v) => (typeof v === 'number' ? formatCurrency(v) : String(v))} />
                    <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 font-medium text-accent-800">Users by role</h3>
              <div className="h-64">
                {usersPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {usersPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-accent-500">
                    No user data yet
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border-2 border-accent-200 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 font-medium text-accent-800">New users (last 30 days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Teachers', count: newLast30Days.teachers, fill: CHART_COLORS[0] },
                      { name: 'Parents', count: newLast30Days.parents, fill: CHART_COLORS[1] },
                      { name: 'Students', count: newLast30Days.students, fill: CHART_COLORS[2] },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {[CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2]].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-accent-800">Quick actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/enrollments"
              className="rounded-xl border-2 border-accent-200 bg-white p-4 transition hover:border-accent-400 hover:shadow-md"
            >
              <span className="text-2xl">📚</span>
              <h3 className="mt-2 font-medium text-accent-800">Manage enrollments</h3>
              <p className="text-sm text-accent-600">Pending and completed enrollments</p>
            </Link>
            <Link
              to="/classes"
              className="rounded-xl border-2 border-accent-200 bg-white p-4 transition hover:border-accent-400 hover:shadow-md"
            >
              <span className="text-2xl">📅</span>
              <h3 className="mt-2 font-medium text-accent-800">Classes</h3>
              <p className="text-sm text-accent-600">Schedules and sessions</p>
            </Link>
            <Link
              to="/ai-review-requests"
              className="rounded-xl border-2 border-accent-200 bg-white p-4 transition hover:border-accent-400 hover:shadow-md"
            >
              <span className="text-2xl">🔍</span>
              <h3 className="mt-2 font-medium text-accent-800">AI review requests</h3>
              <p className="text-sm text-accent-600">Review and resolve AI feedback</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
