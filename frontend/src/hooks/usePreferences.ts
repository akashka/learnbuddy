import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'learnbuddy_preferences';

export type DateFormat = 'short' | 'long';
export type NotificationChannels = {
  email: boolean;
  inApp: boolean;
  push: boolean;
  classReminders: boolean;
  paymentReminders: boolean;
};
export type Preferences = {
  dateFormat: DateFormat;
  timezone: string;
  notifyEmail: boolean;
  soundEffects: boolean;
  notificationChannels: NotificationChannels;
};

const DEFAULT_CHANNELS: NotificationChannels = {
  email: true,
  inApp: true,
  push: false,
  classReminders: true,
  paymentReminders: true,
};



const DEFAULT: Preferences = {
  dateFormat: 'short',
  timezone: 'auto',
  notifyEmail: true,
  soundEffects: true,
  notificationChannels: DEFAULT_CHANNELS,
};

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const channels = parsed.notificationChannels
      ? { ...DEFAULT_CHANNELS, ...parsed.notificationChannels }
      : {
          ...DEFAULT_CHANNELS,
          email: parsed.notifyEmail ?? DEFAULT_CHANNELS.email,
        };
    return {
      dateFormat: parsed.dateFormat ?? DEFAULT.dateFormat,
      timezone: parsed.timezone ?? 'auto',
      notifyEmail: parsed.notifyEmail ?? DEFAULT.notifyEmail,
      soundEffects: parsed.soundEffects ?? DEFAULT.soundEffects,
      notificationChannels: channels,
    };
  } catch {
    return { ...DEFAULT };
  }
}

function save(prefs: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(load);

  useEffect(() => {
    setPrefs(load());
  }, []);

  const update = useCallback((updates: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      save(next);
      return next;
    });
  }, []);

  return { prefs, update };
}
