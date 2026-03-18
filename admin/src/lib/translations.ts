export const translations = {
  en: {
    appName: 'LearnBuddy',
    tagline: 'Learn with fun.',
    welcome: 'Welcome',
    admin: 'Admin',
    home: 'Home',
  },
  hi: {
    appName: 'लर्नबडी',
    tagline: 'मज़े के साथ सीखें!',
    welcome: 'स्वागत है',
    admin: 'व्यवस्थापक',
    home: 'होम',
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKeys = keyof (typeof translations)['en'];
