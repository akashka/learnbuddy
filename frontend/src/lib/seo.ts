/**
 * SEO config for frontend app public pages.
 */

import { BRAND } from '@shared/brand';

export const SEO_PAGES = [
  { path: '/', title: `${BRAND.name} - ${BRAND.tagline}`, description: 'Log in to GuruChakra. One-to-one online tuition for kids with AI monitoring. Access your parent, teacher, or student account.' },
  { path: '/register', title: 'Register', description: 'Create a GuruChakra account. Register as a parent to find teachers, or as a teacher to teach and earn.' },
  { path: '/for-you', title: 'For You', description: 'Whether you\'re a parent, student, or teacher—GuruChakra has something for everyone.' },
  { path: '/for-parents', title: 'For Parents', description: 'Find qualified teachers for your child. AI-monitored classes, BGV verified. Track progress.' },
  { path: '/for-students', title: 'For Students', description: 'One-to-one attention, ask AI anytime. Learn from anywhere with GuruChakra.' },
  { path: '/for-teachers', title: 'For Teachers', description: 'Teach on your terms. Fair pay, flexible schedule. Join GuruChakra.' },
  { path: '/features', title: 'Features', description: 'AI-monitored sessions, DPDP compliant, secure payments. Everything for safe learning.' },
  { path: '/how-it-works', title: 'How It Works', description: 'From finding a teacher to attending classes—your journey with GuruChakra.' },
  { path: '/about-us', title: 'About Us', description: 'GuruChakra connects parents with verified teachers. AI monitors every class. DPDP compliant.' },
  { path: '/contact-us', title: 'Contact Us', description: 'Get in touch with GuruChakra support. We respond typically within 24 hours.' },
  { path: '/faq', title: 'FAQ', description: 'Frequently asked questions about GuruChakra. Parents, students, teachers.' },
  { path: '/privacy-policy', title: 'Privacy Policy', description: 'How GuruChakra collects, uses, and protects your data. DPDP compliant.' },
  { path: '/terms-conditions', title: 'Terms & Conditions', description: 'Terms of service for using GuruChakra.' },
  { path: '/refund-policy', title: 'Refund Policy', description: 'GuruChakra refund policy. Cancellation and refund terms.' },
  { path: '/course-ownership-rules', title: 'Course Ownership Rules', description: 'Course ownership and usage rules for GuruChakra enrollments.' },
  { path: '/safety-and-trust', title: 'Safety & Trust', description: 'AI-monitored sessions, verified teachers, secure payments. How GuruChakra keeps your child safe.' },
  { path: '/parent/register', title: 'Register as Parent', description: 'Create a parent account. Find teachers for your child.' },
  { path: '/parent/register/form', title: 'Parent Registration', description: 'Complete your parent registration on GuruChakra.' },
] as const;
