import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePreferences } from '@/hooks/usePreferences';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { TIMEZONES, getBrowserTimezone } from '@/lib/timezones';
import type { Locale } from '@/lib/translations';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
];

export default function Settings() {
  const { user } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const { prefs, update } = usePreferences();

  const profilePath = user?.role === 'parent' ? '/parent/profile' : user?.role === 'teacher' ? '/teacher/profile' : '/';
  const privacyPath = user?.role === 'parent' ? '/parent/privacy' : user?.role === 'teacher' ? '/teacher/privacy' : '/';

  const s = (key: string) => t(`settingsPage.${key}` as 'settingsPage.language');

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="⚙️"
        title={t('settings')}
        subtitle={s('subtitle')}
      />

      <div className="space-y-6">
        {/* Language */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-brand-100 text-2xl">
                🌐
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('language')}</h2>
                <p className="text-sm text-gray-600">{s('languageDesc')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => setLocale(loc.value)}
                  className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                    locale === loc.value
                      ? 'border-brand-500 bg-brand-100 text-brand-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </ContentCard>

        {/* Display preferences */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-accent-100 text-2xl">
                📅
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('dateFormat')}</h2>
                <p className="text-sm text-gray-600">{s('dateFormatDesc')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => update({ dateFormat: 'short' })}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                  prefs.dateFormat === 'short'
                    ? 'border-brand-500 bg-brand-100 text-brand-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                {s('dateShort')}
              </button>
              <button
                type="button"
                onClick={() => update({ dateFormat: 'long' })}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                  prefs.dateFormat === 'long'
                    ? 'border-brand-500 bg-brand-100 text-brand-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                {s('dateLong')}
              </button>
            </div>
          </div>
        </ContentCard>

        {/* Timezone */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 text-2xl">
                🕐
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('timezone')}</h2>
                <p className="text-sm text-gray-600">{s('timezoneDesc')}</p>
              </div>
            </div>
            <select
              value={prefs.timezone || 'auto'}
              onChange={(e) => update({ timezone: e.target.value })}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-brand-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="auto">
                {s('timezoneAuto')} ({getBrowserTimezone()})
              </option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </ContentCard>

        {/* Notification channels */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 text-2xl">
                🔔
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('notificationChannels')}</h2>
                <p className="text-sm text-gray-600">{s('notificationChannelsDesc')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50">
                <div>
                  <p className="font-medium text-brand-800">{s('notifyEmail')}</p>
                  <p className="text-sm text-gray-600">{s('notifyEmailDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notificationChannels.email}
                  onChange={(e) =>
                    update({
                      notificationChannels: { ...prefs.notificationChannels, email: e.target.checked },
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50">
                <div>
                  <p className="font-medium text-brand-800">{s('notifyInApp')}</p>
                  <p className="text-sm text-gray-600">{s('notifyInAppDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notificationChannels.inApp}
                  onChange={(e) =>
                    update({
                      notificationChannels: { ...prefs.notificationChannels, inApp: e.target.checked },
                    })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50 opacity-75">
                <div>
                  <p className="font-medium text-brand-800">{s('notifyPush')}</p>
                  <p className="text-sm text-gray-500">{s('notifyPushComingSoon')}</p>
                </div>
                <input type="checkbox" disabled className="h-5 w-5 rounded border-gray-300" />
              </label>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="mb-3 text-sm font-medium text-brand-800">{s('notifyByType')}</p>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm">
                  <span className="text-brand-800">{s('notifyClassReminders')}</span>
                  <input
                    type="checkbox"
                    checked={prefs.notificationChannels.classReminders}
                    onChange={(e) =>
                      update({
                        notificationChannels: { ...prefs.notificationChannels, classReminders: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </label>
                <label className="mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm">
                  <span className="text-brand-800">{s('notifyPaymentReminders')}</span>
                  <input
                    type="checkbox"
                    checked={prefs.notificationChannels.paymentReminders}
                    onChange={(e) =>
                      update({
                        notificationChannels: { ...prefs.notificationChannels, paymentReminders: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </label>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Sound effects */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 text-2xl">
                🔊
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('soundEffects')}</h2>
                <p className="text-sm text-gray-600">{s('soundEffectsDesc')}</p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50">
              <input
                type="checkbox"
                checked={prefs.soundEffects}
                onChange={(e) => update({ soundEffects: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-medium text-brand-800">{s('soundEffects')}</span>
            </label>
          </div>
        </ContentCard>

        {/* Quick links */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-2xl">
                🔗
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-800">{s('quickLinks')}</h2>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                to={profilePath}
                className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
              >
                <div>
                  <p className="font-medium text-brand-800">{s('profile')}</p>
                  <p className="text-sm text-gray-600">{s('profileDesc')}</p>
                </div>
                <span className="text-brand-500">→</span>
              </Link>
              <Link
                to={privacyPath}
                className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
              >
                <div>
                  <p className="font-medium text-brand-800">{s('privacy')}</p>
                  <p className="text-sm text-gray-600">{s('privacyDesc')}</p>
                </div>
                <span className="text-brand-500">→</span>
              </Link>
              {(user?.role === 'parent' || user?.role === 'teacher') && (
                <Link
                  to="/disputes"
                  className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <div>
                    <p className="font-medium text-brand-800">{s('disputes')}</p>
                    <p className="text-sm text-gray-600">{s('disputesDesc')}</p>
                  </div>
                  <span className="text-brand-500">→</span>
                </Link>
              )}
            </div>
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
