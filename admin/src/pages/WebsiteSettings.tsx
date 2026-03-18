import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

type Settings = {
  playStoreUrl: string;
  appStoreUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  contactPhone: string;
  contactHours: string;
  contactDays: string;
};

const LABELS: Record<keyof Settings, string> = {
  playStoreUrl: 'Google Play Store URL',
  appStoreUrl: 'Apple App Store URL',
  facebookUrl: 'Facebook URL',
  twitterUrl: 'X (Twitter) URL',
  linkedinUrl: 'LinkedIn URL',
  instagramUrl: 'Instagram URL',
  youtubeUrl: 'YouTube URL',
  contactPhone: 'Call Center / Helpline Number',
  contactHours: 'Call Center Hours (e.g. 9 AM – 6 PM)',
  contactDays: 'Call Center Days (e.g. Mon – Sat)',
};

export default function WebsiteSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.websiteSettings
      .get()
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings((s) => (s ? { ...s, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.websiteSettings.update(settings);
      toast.success('Website settings saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-800">Website Settings</h1>
          <p className="mt-1 text-sm text-accent-700">
            App store links and social media URLs shown on the website footer, Contact Us, About Us, and app download sections.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !settings}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <DataState loading={loading} error={error}>
        {settings && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-accent-800">App Store Links</h2>
              <p className="mb-4 text-sm text-accent-600">
                These URLs are used for the &quot;Download the App&quot; buttons across the website.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.playStoreUrl}</label>
                  <input
                    type="url"
                    value={settings.playStoreUrl}
                    onChange={(e) => handleChange('playStoreUrl', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.appStoreUrl}</label>
                  <input
                    type="url"
                    value={settings.appStoreUrl}
                    onChange={(e) => handleChange('appStoreUrl', e.target.value)}
                    placeholder="https://apps.apple.com/app/..."
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-accent-800">Call Center / Helpline</h2>
              <p className="mb-4 text-sm text-accent-600">
                Shown on the Contact Us page. Phone number, hours, and days of operation.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.contactPhone}</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="+91 1800-123-4567"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.contactHours}</label>
                  <input
                    type="text"
                    value={settings.contactHours}
                    onChange={(e) => handleChange('contactHours', e.target.value)}
                    placeholder="9 AM – 6 PM IST"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.contactDays}</label>
                  <input
                    type="text"
                    value={settings.contactDays}
                    onChange={(e) => handleChange('contactDays', e.target.value)}
                    placeholder="Mon – Sat"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-accent-800">Social Media Links</h2>
              <p className="mb-4 text-sm text-accent-600">
                Icons appear in the footer and on Contact Us / About Us pages. Leave blank to hide.
              </p>
              <div className="space-y-4">
                {(['facebookUrl', 'twitterUrl', 'linkedinUrl', 'instagramUrl', 'youtubeUrl'] as const).map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS[key]}</label>
                    <input
                      type="url"
                      value={settings[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={`https://${key.replace('Url', '')}.com/...`}
                      className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
