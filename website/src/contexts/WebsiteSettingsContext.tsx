import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchWebsiteSettings, type WebsiteSettingsData } from '@/lib/api';

const DEFAULTS: WebsiteSettingsData = {
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.guruchakra.app',
  appStoreUrl: 'https://apps.apple.com/app/guruchakra/id000000000',
  facebookUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  contactPhone: '+91 1800-123-4567',
  contactHours: '9 AM – 6 PM',
  contactDays: 'Mon – Sat',
};

const WebsiteSettingsContext = createContext<WebsiteSettingsData>(DEFAULTS);

export function WebsiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettingsData>(DEFAULTS);

  useEffect(() => {
    fetchWebsiteSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  return (
    <WebsiteSettingsContext.Provider value={settings}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}
