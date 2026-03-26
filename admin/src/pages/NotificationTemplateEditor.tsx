import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { RichTextEditor } from '@/components/RichTextEditor';
import BackLink from '@/components/BackLink';

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
};

const SMS_APPROVED_GUIDANCE = [
  'Keep under 160 chars for single SMS.',
  'Use {{otp}} for OTP placeholders.',
  'Avoid promotional language for transactional messages.',
];

export default function NotificationTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTab = (location.state as { returnTab?: string } | null)?.returnTab;
  const toast = useToast();
  const isNew = !id;

  const channelParam = searchParams.get('channel') as 'sms' | 'email' | 'in_app' | null;
  const [channel, setChannel] = useState<'sms' | 'email' | 'in_app'>(channelParam || 'sms');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [body, setBody] = useState('');
  const [approvedWordings, setApprovedWordings] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [variableHints, setVariableHints] = useState<string[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      if (channelParam) setChannel(channelParam);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    adminApi.notificationTemplates
      .get(id!)
      .then((t: Template) => {
        setChannel(t.channel as 'sms' | 'email' | 'in_app');
        setCode(t.code);
        setName(t.name);
        setDescription(t.description || '');
        setIsActive(t.isActive);
        setBody(t.body || '');
        setApprovedWordings(t.approvedWordings || []);
        setSubject(t.subject || '');
        setBodyHtml(t.bodyHtml || '');
        setHeaderHtml(t.headerHtml || '');
        setFooterHtml(t.footerHtml || '');
        setLogoUrl(t.logoUrl || '');
        setTitle(t.title || '');
        setMessage(t.message || '');
        setCtaLabel(t.ctaLabel || '');
        setCtaUrl(t.ctaUrl || '');
        setVariableHints(t.variableHints || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id, isNew, channelParam]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!code.trim()) {
      toast.error('Code is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await adminApi.notificationTemplates.create({
          channel,
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          body: channel === 'sms' ? body : undefined,
          approvedWordings: channel === 'sms' ? approvedWordings : undefined,
          subject: channel === 'email' ? subject : undefined,
          bodyHtml: channel === 'email' ? bodyHtml : undefined,
          headerHtml: channel === 'email' ? headerHtml || undefined : undefined,
          footerHtml: channel === 'email' ? footerHtml || undefined : undefined,
          logoUrl: channel === 'email' ? logoUrl || undefined : undefined,
          title: channel === 'in_app' ? title : undefined,
          message: channel === 'in_app' ? message : undefined,
          ctaLabel: channel === 'in_app' ? ctaLabel || undefined : undefined,
          ctaUrl: channel === 'in_app' ? ctaUrl || undefined : undefined,
          variableHints: variableHints.length > 0 ? variableHints : undefined,
        });
        toast.success('Template created');
      } else {
        await adminApi.notificationTemplates.update(id!, {
          name: name.trim(),
          description: description.trim() || '',
          isActive,
          body: channel === 'sms' ? body : undefined,
          approvedWordings: channel === 'sms' ? approvedWordings : undefined,
          subject: channel === 'email' ? subject : undefined,
          bodyHtml: channel === 'email' ? bodyHtml : undefined,
          headerHtml: channel === 'email' ? headerHtml || '' : undefined,
          footerHtml: channel === 'email' ? footerHtml || '' : undefined,
          logoUrl: channel === 'email' ? logoUrl || '' : undefined,
          title: channel === 'in_app' ? title : undefined,
          message: channel === 'in_app' ? message : undefined,
          ctaLabel: channel === 'in_app' ? ctaLabel || '' : undefined,
          ctaUrl: channel === 'in_app' ? ctaUrl || '' : undefined,
          variableHints: variableHints.length > 0 ? variableHints : undefined,
        });
        toast.success('Template updated');
      }
      const tab = returnTab || (channel as string);
      navigate(tab ? `/notification-templates?tab=${tab}` : '/notification-templates');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addApprovedWording = () => {
    setApprovedWordings([...approvedWordings, '']);
  };

  const updateApprovedWording = (i: number, v: string) => {
    const next = [...approvedWordings];
    next[i] = v;
    setApprovedWordings(next);
  };

  const removeApprovedWording = (i: number) => {
    setApprovedWordings(approvedWordings.filter((_, j) => j !== i));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-200 border-t-accent-600" />
          <span className="text-accent-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BackLink to="/notification-templates" />
          <h1 className="text-2xl font-bold text-accent-800">
            {isNew ? 'Create Template' : `Edit: ${name || code}`}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as 'sms' | 'email' | 'in_app')}
              disabled={!isNew}
              className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 disabled:bg-accent-50"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="in_app">In-App</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-accent-700">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!isNew}
              placeholder="e.g. login_otp, class_reminder_15min"
              className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 disabled:bg-accent-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-accent-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Human-readable name"
            className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-accent-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When this notification is sent"
            className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
          />
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-accent-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-accent-700">
              Active (template will be used when sending)
            </label>
          </div>
        )}

        {/* SMS */}
        {channel === 'sms' && (
          <>
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-800">Approved wordings (guidance)</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                {SMS_APPROVED_GUIDANCE.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Your OTP is {{otp}}. Valid for 5 minutes."
                className="w-full rounded-lg border border-accent-200 px-3 py-2 font-mono text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
              {body.length > 0 && (
                <p className="mt-1 text-xs text-accent-500">
                  {body.length} chars {body.length > 160 ? '(multi-SMS)' : '(single SMS)'}
                </p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-accent-700">Approved wordings (for guidance)</label>
                <button
                  type="button"
                  onClick={addApprovedWording}
                  className="text-sm text-accent-600 hover:text-accent-800"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {approvedWordings.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={w}
                      onChange={(e) => updateApprovedWording(i, e.target.value)}
                      placeholder="Alternative approved wording"
                      className="flex-1 rounded-lg border border-accent-200 px-3 py-2 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeApprovedWording(i)}
                      className="rounded px-2 text-red-600 hover:bg-red-50"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Email */}
        {channel === 'email' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Header HTML</label>
              <textarea
                value={headerHtml}
                onChange={(e) => setHeaderHtml(e.target.value)}
                rows={3}
                placeholder="<div>...</div> or leave empty"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 font-mono text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Body HTML</label>
              <RichTextEditor
                content={bodyHtml}
                onChange={setBodyHtml}
                placeholder="Main email content..."
                minHeight="200px"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Footer HTML</label>
              <textarea
                value={footerHtml}
                onChange={(e) => setFooterHtml(e.target.value)}
                rows={3}
                placeholder="<div>© GuruChakra. Unsubscribe link.</div>"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 font-mono text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
          </>
        )}

        {/* In-app */}
        {channel === 'in_app' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Notification body. Use {{studentName}}, {{subject}}, etc."
                className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">CTA Label</label>
                <input
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="View Class"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">CTA URL</label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="/parent/classes"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-accent-700">Variable hints (for admins)</label>
          <input
            type="text"
            value={variableHints.join(', ')}
            onChange={(e) =>
              setVariableHints(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="{{otp}}, {{studentName}}, {{subject}}"
            className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
          />
        </div>
      </div>
    </div>
  );
}
