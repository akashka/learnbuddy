import { useState } from 'react';
import ReportTabOverview from '@/pages/reports/ReportTabOverview';
import ReportTabCohorts from '@/pages/reports/ReportTabCohorts';
import ReportTabTeacherPerformance from '@/pages/reports/ReportTabTeacherPerformance';
import ReportTabRevenue from '@/pages/reports/ReportTabRevenue';
import ReportTabMarketing from '@/pages/reports/ReportTabMarketing';
import ReportTabOperations from '@/pages/reports/ReportTabOperations';
import ReportTabTechnology from '@/pages/reports/ReportTabTechnology';
import ReportTabSystemStatus from '@/pages/reports/ReportTabSystemStatus';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📈' },
  { id: 'cohorts', label: 'Cohorts', icon: '📊' },
  { id: 'teacher', label: 'Teacher Perf', icon: '👩‍🏫' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
  { id: 'technology', label: 'Technology', icon: '🤖' },
  { id: 'system', label: 'System Status', icon: '🔧' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-accent-50/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-accent-900 sm:text-3xl">
            Business Reports
          </h1>
          <p className="mt-1 text-accent-600">
            Analytics for investors, executives, marketing, sales, operations & technology
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-xl border-2 border-accent-200 bg-white p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-accent-100 text-accent-900 shadow-sm'
                    : 'text-accent-600 hover:bg-accent-50 hover:text-accent-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="animate-fade-in">
          {activeTab === 'overview' && <ReportTabOverview />}
          {activeTab === 'cohorts' && <ReportTabCohorts />}
          {activeTab === 'teacher' && <ReportTabTeacherPerformance />}
          {activeTab === 'revenue' && <ReportTabRevenue />}
          {activeTab === 'marketing' && <ReportTabMarketing />}
          {activeTab === 'operations' && <ReportTabOperations />}
          {activeTab === 'technology' && <ReportTabTechnology />}
          {activeTab === 'system' && <ReportTabSystemStatus />}
        </div>
      </div>
    </div>
  );
}
