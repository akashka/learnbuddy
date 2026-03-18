/**
 * LearnBuddy brand and company copy.
 * Shared across frontend, website, app. Backend uses backend/src/lib/brand.ts.
 * Keep in sync with docs/BRAND-GUIDELINES.md and backend/src/lib/brand.ts
 */

export const BRAND = {
  name: 'LearnBuddy',
  tagline: 'Learn with fun.',
} as const;

export const COMPANY = {
  vision:
    'Every child deserves a learning buddy—personalized, safe, and fun.',
  mission:
    'To make quality education accessible through one-to-one tuition, AI-powered safety, and learning that feels like fun.',
  descriptionShort:
    'LearnBuddy is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring—safe, personalized, and fun.',
  contact: {
    email: 'support@learnbuddy.com',
    hours: 'Mon–Sat, 9 AM – 6 PM IST',
    responseTime: 'Typically within 24 hours',
  },
} as const;
