import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
        <p className="mt-2 text-gray-600">Overview of platform health, AI infrastructure, and student wellbeing.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link 
          to="/admin/ai-usage"
          className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">AI Usage Stats</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Monitor token consumption, costs per model, and provider-level API performance.
          </p>
          <div className="mt-4 flex items-center text-sm font-semibold text-brand-600">
            View Analytics
            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link 
          to="/admin/sentiment-alerts"
          className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Sentiment Alerts</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Identify at-risk students based on AI-analyzed sentiment trends and safe content flags.
          </p>
          <div className="mt-4 flex items-center text-sm font-semibold text-orange-600">
            Monitor Wellbeing
            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <div className="rounded-2xl border border-dotted border-gray-300 bg-gray-50/50 p-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-400">More Tools Soon</h3>
          <p className="mt-2 text-sm text-gray-400">
            Future modules: Teacher vetting, Syllabus compliance, Automated disputes.
          </p>
        </div>
      </div>
    </div>
  );
}
