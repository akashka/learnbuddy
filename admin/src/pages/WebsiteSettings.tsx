import { useState, useEffect } from 'react';
import { adminApi, type WebsiteSettings } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

const LOCALES = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { id: 'bn', label: 'Bengali', flag: '🇮🇳' },
  { id: 'te', label: 'Telugu', flag: '🇮🇳' },
  { id: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { id: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { id: 'gu', label: 'Gujarati', flag: '🇮🇳' },
  { id: 'kn', label: 'Kannada', flag: '🇮🇳' },
  { id: 'ml', label: 'Malayalam', flag: '🇮🇳' },
  { id: 'pa', label: 'Punjabi', flag: '🇮🇳' },
];

const LABELS: Record<keyof WebsiteSettings, string> = {
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
  const [selectedLang, setSelectedLang] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi.websiteSettings
      .get(selectedLang)
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [selectedLang]);

  const handleChange = (key: keyof WebsiteSettings, value: string) => {
    setSettings((s) => (s ? { ...s, [key]: value } : null));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.websiteSettings.update(settings, selectedLang);
      toast.success(`Website settings (${selectedLang}) saved`);
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
            Global configuration and localized contact details for the entire platform.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !settings || loading}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-accent-200 pb-2">
        {LOCALES.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelectedLang(l.id)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              selectedLang === l.id
                ? 'bg-accent-100 text-accent-800'
                : 'text-accent-600 hover:bg-accent-50 hover:text-accent-700'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <DataState loading={loading} error={error}>
        {settings && (
          <div className="max-w-2xl space-y-6">
            {selectedLang === 'en' && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-accent-800">App Store Links</h2>
                <p className="mb-4 text-sm text-accent-600">
                  Global URLs for mobile applications. These are shared across all languages.
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
            )}

            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 font-semibold text-accent-800">
                Contact Details ({selectedLang})
              </h2>
              <p className="mb-4 text-sm text-accent-600">
                Localized support information. Phone number is global, but hours and days can be translated.
              </p>
              <div className="space-y-4">
                {selectedLang === 'en' && (
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
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.contactHours} ({selectedLang})</label>
                  <input
                    type="text"
                    value={settings.contactHours}
                    onChange={(e) => handleChange('contactHours', e.target.value)}
                    placeholder="9 AM – 6 PM IST"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">{LABELS.contactDays} ({selectedLang})</label>
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

            {selectedLang === 'en' && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-4 font-semibold text-accent-800">Social Media Links</h2>
                <p className="mb-4 text-sm text-accent-600">
                  Global social media profiles. Leave blank to hide the corresponding icon.
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
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
