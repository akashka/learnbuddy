/**
 * GuruChakra brand and company copy.
 * Source of truth for vision, mission, values, and descriptions.
 * Use across CMS, API, and marketing. Keep in sync with docs/BRAND-GUIDELINES.md
 */

export const BRAND = {
  name: 'GuruChakra',
  tagline: 'Learn with fun.',
} as const;

export const COMPANY = {
  vision:
    'Every child deserves a learning buddy—personalized, safe, and fun.',
  mission:
    'To make quality education accessible through one-to-one tuition, AI-powered safety, and learning that feels like fun.',
  descriptionShort:
    'GuruChakra is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring—safe, personalized, and fun.',
  descriptionMedium:
    'GuruChakra connects parents with qualified, verified teachers for personalized online tuition. Every class is AI-monitored for safety, and students can ask AI anytime for help—so learning is effective, engaging, and secure.',
  descriptionLong:
    'GuruChakra is a one-to-one online tuition platform for children, combining qualified teachers with AI-powered monitoring. We connect parents with verified educators for safe, personalized learning from home. Our AI monitors classes for safety, generates exams and study materials, and answers student doubts 24/7. We\'re DPDP compliant and built for trust—so parents can focus on their child\'s growth, not logistics.',
  values: [
    {
      name: 'Trust',
      description:
        'We verify every teacher, protect every child\'s data, and operate with full transparency. DPDP compliant, always.',
    },
    {
      name: 'Quality',
      description:
        'Expert teachers, AI-enhanced learning, and rigorous standards. We never compromise on what children deserve.',
    },
    {
      name: 'Accessibility',
      description:
        'Learn from anywhere—mobile, tablet, or laptop. One-to-one attention without the commute.',
    },
    {
      name: 'Fun',
      description:
        'Learning should spark joy. Our tagline says it: Learn with fun.',
    },
    {
      name: 'Innovation',
      description:
        'AI that helps, not replaces. We use technology to make teaching and learning better.',
    },
  ],
  differentiators: [
    'AI-monitored sessions — Safety and quality in every class',
    'One-to-one attention — Personalized learning, not crowded batches',
    'Ask AI anytime — Instant help with doubts and study materials',
    'DPDP compliant — Your child\'s data is protected',
    'Verified teachers — Background checks and AI qualification exams',
  ],
  contact: {
    email: 'support@guruchakra.com',
    hours: 'Mon–Sat, 9 AM – 6 PM IST',
    responseTime: 'Typically within 24 hours',
  },
} as const;
