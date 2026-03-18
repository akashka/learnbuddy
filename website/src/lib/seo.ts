/**
 * SEO config for all website pages.
 * Used by PageMeta and sitemap generation.
 */

import { BRAND } from '@shared/brand';

export const SEO_PAGES = [
  {
    path: '/',
    title: `${BRAND.name} - Learn with Fun!`,
    description: 'One-to-one online tuition for kids with AI monitoring. Find qualified teachers, AI-powered learning, DPDP compliant. Safe, personalized learning from home.',
  },
  {
    path: '/for-you',
    title: 'For You',
    description: 'Whether you\'re a parent, student, or teacher—LearnBuddy has something for everyone. Find qualified teachers, track progress, or teach on your terms.',
  },
  {
    path: '/for-parents',
    title: 'For Parents',
    description: 'Find qualified teachers for your child. AI-monitored classes, BGV verified teachers, track progress. Safe, personalized one-to-one tuition from home.',
  },
  {
    path: '/for-students',
    title: 'For Students',
    description: 'One-to-one attention, ask AI anytime, AI-moderated exams. Learn from anywhere with the LearnBuddy app. Fun, effective learning.',
  },
  {
    path: '/for-teachers',
    title: 'For Teachers',
    description: 'Teach on your terms. Fair pay, flexible schedule, AI tools to help you teach smarter. Join qualified teachers on LearnBuddy.',
  },
  {
    path: '/features',
    title: 'Features',
    description: 'AI-monitored sessions, DPDP compliant, BGV verified teachers, secure payments. Everything for safe, effective, and fun learning.',
  },
  {
    path: '/how-it-works',
    title: 'How It Works',
    description: 'From finding a teacher to attending classes—your journey with LearnBuddy. Four simple steps for parents, students, and teachers.',
  },
  {
    path: '/about-us',
    title: 'About Us',
    description: 'LearnBuddy connects parents with verified teachers for one-to-one online tuition. AI monitors every class. DPDP compliant. Learn with fun.',
  },
  {
    path: '/contact-us',
    title: 'Contact Us',
    description: 'Have questions or feedback? Get in touch with LearnBuddy support. We respond typically within 24 hours.',
  },
  {
    path: '/faq',
    title: 'FAQ',
    description: 'Frequently asked questions about LearnBuddy. Parents, students, teachers—find answers on enrollment, payments, safety, and more.',
  },
  {
    path: '/careers',
    title: 'Careers',
    description: 'Join the LearnBuddy team. Help make quality education accessible to every child. Remote-first, flexible, impactful.',
  },
  {
    path: '/our-team',
    title: 'Our Team',
    description: 'Meet the people behind LearnBuddy. We\'re building the future of learning—one student at a time.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'How LearnBuddy collects, uses, and protects your data. DPDP compliant. Learn about your rights and our data practices.',
  },
  {
    path: '/terms-conditions',
    title: 'Terms & Conditions',
    description: 'Terms of service for using LearnBuddy. Enrollment, payments, conduct, and more. Please read carefully.',
  },
] as const;
