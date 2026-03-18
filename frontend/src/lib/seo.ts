/**
 * SEO config for frontend app public pages.
 */

import { BRAND } from '@shared/brand';

export const SEO_PAGES = [
  { path: '/', title: `${BRAND.name} - ${BRAND.tagline}`, description: 'One-to-one online tuition for kids with AI monitoring. Find teachers, enroll, or teach. Safe, personalized learning from home.' },
  { path: '/login', title: 'Login', description: 'Log in to LearnBuddy. Access your parent, teacher, or student account.' },
  { path: '/register', title: 'Register', description: 'Create a LearnBuddy account. Register as a parent to find teachers, or as a teacher to teach and earn.' },
  { path: '/for-you', title: 'For You', description: 'Whether you\'re a parent, student, or teacher—LearnBuddy has something for everyone.' },
  { path: '/for-parents', title: 'For Parents', description: 'Find qualified teachers for your child. AI-monitored classes, BGV verified. Track progress.' },
  { path: '/for-students', title: 'For Students', description: 'One-to-one attention, ask AI anytime. Learn from anywhere with LearnBuddy.' },
  { path: '/for-teachers', title: 'For Teachers', description: 'Teach on your terms. Fair pay, flexible schedule. Join LearnBuddy.' },
  { path: '/features', title: 'Features', description: 'AI-monitored sessions, DPDP compliant, secure payments. Everything for safe learning.' },
  { path: '/how-it-works', title: 'How It Works', description: 'From finding a teacher to attending classes—your journey with LearnBuddy.' },
  { path: '/about-us', title: 'About Us', description: 'LearnBuddy connects parents with verified teachers. AI monitors every class. DPDP compliant.' },
  { path: '/contact-us', title: 'Contact Us', description: 'Get in touch with LearnBuddy support. We respond typically within 24 hours.' },
  { path: '/faq', title: 'FAQ', description: 'Frequently asked questions about LearnBuddy. Parents, students, teachers.' },
  { path: '/privacy-policy', title: 'Privacy Policy', description: 'How LearnBuddy collects, uses, and protects your data. DPDP compliant.' },
  { path: '/terms-conditions', title: 'Terms & Conditions', description: 'Terms of service for using LearnBuddy.' },
  { path: '/refund-policy', title: 'Refund Policy', description: 'LearnBuddy refund policy. Cancellation and refund terms.' },
  { path: '/course-ownership-rules', title: 'Course Ownership Rules', description: 'Course ownership and usage rules for LearnBuddy enrollments.' },
  { path: '/parent/register', title: 'Register as Parent', description: 'Create a parent account. Find teachers for your child.' },
  { path: '/parent/register/form', title: 'Parent Registration', description: 'Complete your parent registration on LearnBuddy.' },
] as const;
