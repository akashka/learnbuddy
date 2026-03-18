import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import Tabs from '@/components/Tabs';

type Template = {
  _id: string;
  channel: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  body?: string;
  approvedWordings?: string[];
  subject?: string;
  bodyHtml?: string;
  headerHtml?: string;
  footerHtml?: string;
  logoUrl?: string;
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  variableHints?: string[];
  createdAt: string;
  updatedAt: string;
};

const CHANNELS = [
  { id: 'sms', label: 'SMS', icon: '📱' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'in_app', label: 'In-App', icon: '🔔' },
] as const;

const SMS_APPROVED_GUIDANCE = [
  'Keep under 160 chars for single SMS; use {{otp}} for OTP.',
  'Avoid promotional language for OTP/transactional messages.',
  'Include sender identity (e.g. LearnBuddy) for DND compliance.',
  'Use approved transactional templates from your SMS provider.',
];

export default function NotificationTemplates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'sms' | 'email' | 'in_app' | null;
  const [activeTab, setActiveTab] = useState<string>(tabParam && ['sms','email','in_app'].includes(tabParam) ? tabParam : 'sms');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next, { replace: true });
  };

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    setError(null);
    const channel = activeTab as 'sms' | 'email' | 'in_app';
    adminApi.notificationTemplates
      .list({ channel, includeInactive })
      .then((res) => setTemplates(res.templates))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [activeTab, includeInactive]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleToggleActive = async (t: Template) => {
    try {
      await adminApi.notificationTemplates.update(t._id, { isActive: !t.isActive });
      toast.success(t.isActive ? 'Template deactivated' : 'Template activated');
      fetchTemplates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Notification Templates</h1>
          <p className="mt-1 text-sm text-accent-700">
            Manage SMS, email, and in-app notification content. Edit, activate, or create new templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-accent-700">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-accent-300"
            />
            Show inactive
          </label>
          <Link
            to={`/notification-templates/new?channel=${activeTab}`}
            state={{ returnTab: activeTab }}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700"
          >
            + Create
          </Link>
        </div>
      </div>

      <Tabs
        tabs={CHANNELS.map((c) => ({ id: c.id, label: `${c.icon} ${c.label}` }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="Notification channel tabs"
      />

      {activeTab === 'sms' && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Approved wordings (guidance)</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {SMS_APPROVED_GUIDANCE.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <DataState loading={loading} error={error} onRetry={fetchTemplates}>
        {templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t._id}
                className={`rounded-lg border bg-white shadow-sm transition ${
                  t.isActive ? 'border-accent-200' : 'border-accent-100 bg-accent-50/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-accent-800">{t.name}</span>
                      <span className="rounded bg-accent-100 px-2 py-0.5 text-xs text-accent-700">
                        {t.code}
                      </span>
                      {!t.isActive && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-1 text-sm text-accent-600">{t.description}</p>
                    )}
                    <div className="mt-2 line-clamp-2 text-sm text-accent-500">
                      {activeTab === 'sms' && t.body && (
                        <span title={t.body}>{t.body.slice(0, 80)}{t.body.length > 80 ? '…' : ''}</span>
                      )}
                      {activeTab === 'email' && t.subject && (
                        <span>Subject: {t.subject}</span>
                      )}
                      {activeTab === 'in_app' && t.title && (
                        <span>{t.title}: {t.message?.slice(0, 50)}{(t.message?.length ?? 0) > 50 ? '…' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        t.isActive
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link
                      to={`/notification-templates/${t._id}`}
                      className="rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-accent-200 bg-accent-50/30 p-12 text-center">
            <p className="text-accent-600">No {activeTab} templates yet.</p>
            <Link
              to={`/notification-templates/new?channel=${activeTab}`}
              state={{ returnTab: activeTab }}
              className="mt-4 inline-block rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              Create first template
            </Link>
          </div>
        )}
      </DataState>
    </div>
  );
}
