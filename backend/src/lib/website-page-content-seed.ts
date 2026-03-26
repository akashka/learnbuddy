/**
 * Seed data for WebsitePageContent - extracted from website static pages.
 */

export const WEBSITE_PAGE_CONTENT_SEED: Record<string, Record<string, unknown>> = {
  'landing-sections': {
    howItWorks: [
      { step: 1, title: 'Choose', desc: 'Pick a teacher from our verified marketplace', icon: '👤' },
      { step: 2, title: 'Connect', desc: 'Book a slot and join live class from home', icon: '📱' },
      { step: 3, title: 'Learn', desc: 'One-to-one with AI monitoring for safety', icon: '📚' },
      { step: 4, title: 'Grow', desc: 'Track progress, get AI help, exams & feedback', icon: '📈' },
    ],
    benefits: [
      { icon: '🏠', title: 'Learn from Home', desc: 'No commute. Safe, comfortable learning.' },
      { icon: '🤖', title: 'AI Monitored', desc: 'Every class is safe. AI watches over.' },
      { icon: '💬', title: 'Ask AI Anytime', desc: '24/7 doubt help. Instant answers.' },
      { icon: '📊', title: 'Track Progress', desc: 'Parents see growth. Real-time reports.' },
    ],
    aiFeatures: [
      { title: 'Class Monitoring', desc: 'AI watches every session for safety & quality' },
      { title: 'Exam Generation', desc: 'Smart tests tailored to your syllabus' },
      { title: 'Instant Doubt Help', desc: 'Ask anything—AI explains like a friend' },
      { title: 'Study Materials', desc: 'AI creates notes, summaries, practice' },
    ],
    reviews: [
      { name: 'Priya M.', role: 'Parent', text: "My daughter's math improved by 40% in 3 months. The AI doubt help is amazing!", rating: 5 },
      { name: 'Rahul K.', role: 'Teacher', text: 'I earn 3x more than teaching offline. Flexible schedule, great support.', rating: 5 },
      { name: 'Anita S.', role: 'Parent', text: 'Love knowing AI monitors every class. Peace of mind while my son learns.', rating: 5 },
      { name: 'Vikram T.', role: 'Teacher', text: 'AI tools help me focus on teaching. Exam prep is so much easier.', rating: 5 },
      { name: 'Sneha R.', role: 'Parent', text: 'My kids love learning from home. No more rushing to tuition centers!', rating: 5 },
      { name: 'Meera P.', role: 'Parent', text: 'Good platform overall. Sometimes the app is a bit slow, but teachers are great.', rating: 4 },
      { name: 'Arjun D.', role: 'Teacher', text: 'Decent earnings. Would like more flexibility in scheduling. Support team is helpful.', rating: 4 },
      { name: 'Kavita N.', role: 'Parent', text: 'Started well. Had a small issue with a class reschedule but it was resolved quickly.', rating: 4 },
    ],
    roleCards: [
      { to: '/for-parents', title: 'Parents', image: '/images/parent-student-progress.png', desc: 'Track progress, find teachers, peace of mind with AI monitoring.' },
      { to: '/for-students', title: 'Students', image: '/images/kids-learning-home.png', desc: 'Learn from home with AI help. Ask doubts anytime. Grow faster.' },
      { to: '/for-teachers', title: 'Teachers', image: '/images/teacher-online.png', desc: 'Teach on your terms. Flexible. Fair pay. AI tools to help.' },
    ],
  },
  'for-you': {
    heroTitle: 'For You',
    heroSubtitle: "Whether you're a parent, student, or teacher—GuruChakra has something for everyone.",
    sectionTitle: 'Choose your path',
    roles: [
      { to: '/for-parents', title: 'For Parents', emoji: '👨‍👩‍👧', desc: 'Find qualified teachers, track progress, and give your child the best learning experience. AI-monitored for safety.', gradient: 'from-brand-50 via-white to-accent-50/40', border: 'border-brand-100', image: '/images/parent-student-progress.png', accent: '🎯' },
      { to: '/for-students', title: 'For Students', emoji: '📚', desc: 'One-to-one attention, ask AI anytime, AI-moderated exams. Learn from anywhere with the app.', gradient: 'from-accent-50/50 via-white to-brand-50/50', border: 'border-accent-100', image: '/images/kids-learning-home.png', accent: '✨' },
      { to: '/for-teachers', title: 'For Teachers', emoji: '👩‍🏫', desc: 'Teach on your terms. Fair pay, flexible schedule. AI tools to help you teach smarter.', gradient: 'from-brand-50/80 via-white to-accent-50/60', border: 'border-brand-200', image: '/images/teacher-online.png', accent: '💼' },
    ],
  },
  features: {
    heroTitle: 'Features',
    heroSubtitle: 'Everything you need for safe, effective, and fun learning—powered by AI and built for trust.',
    safetyFeatures: [
      { title: 'DPDP Compliant', desc: "Full compliance with India's Digital Personal Data Protection Act. Children's data is protected.", icon: '🛡️', emoji: '🔒' },
      { title: 'AI Monitored Sessions', desc: 'Every class and exam is monitored by AI for safety and quality. Parents get peace of mind with real-time oversight.', icon: '📹', emoji: '🤖' },
      { title: 'Teachers Screened & BGV Checked', desc: 'Background verification for all teachers. AI qualification exam ensures teaching quality and student safety.', icon: '✅', emoji: '👨‍🏫' },
    ],
    aiFeatures: [
      { title: 'Ask AI Anytime', desc: 'Students get instant help with doubts 24/7. AI-powered study materials and explanations.', icon: '💬', emoji: '💡' },
      { title: 'AI Moderated Exams', desc: 'Fair, unbiased exam generation and evaluation. Human review option for appeals.', icon: '📝', emoji: '📊' },
      { title: 'AI Study Materials', desc: 'Personalized study content generated for each topic.', icon: '📚', emoji: '✨' },
    ],
    platformFeatures: [
      { title: 'One-to-One Tuition', desc: 'Personal attention. No crowded classes.', icon: '👤', emoji: '🎯' },
      { title: 'Mobile App', desc: 'iOS and Android. Learn anywhere, anytime.', icon: '📱', emoji: '📲' },
      { title: 'Secure Payments', desc: 'Pay through the app. Teachers get paid on time.', icon: '💳', emoji: '🔐' },
      { title: 'Reschedule Anytime', desc: 'Flexible class scheduling for students and teachers.', icon: '📅', emoji: '⏰' },
    ],
    aiImage: '/images/ai-monitoring.svg',
  },
  'how-it-works': {
    heroTitle: 'How It Works',
    heroSubtitle: "From finding a teacher to attending classes—here's your journey with GuruChakra.",
    fourSteps: [
      { step: 1, title: 'Choose', desc: 'Pick a teacher from our verified marketplace', icon: '👤' },
      { step: 2, title: 'Connect', desc: 'Book a slot and join live class from home', icon: '📱' },
      { step: 3, title: 'Learn', desc: 'One-to-one with AI monitoring for safety', icon: '📚' },
      { step: 4, title: 'Grow', desc: 'Track progress, get AI help, exams & feedback', icon: '📈' },
    ],
    forParentsSteps: [
      "Download the app from Play Store or App Store",
      "Sign up as a parent and add your child's details (board, class, subject)",
      "Browse the marketplace. Filter by board, class, subject. Read reviews.",
      "Choose a batch, pay securely, and your child is enrolled",
      "Your child joins live one-to-one classes. AI monitors every session.",
    ],
    forStudentsSteps: [
      "Log in with your student ID (set by your parent)",
      "View your classes and join live sessions",
      "Ask AI doubts anytime between classes",
      "Take AI-generated exams and track your progress",
    ],
    forTeachersSteps: [
      "Register, complete profile, pass AI qualification exam",
      "Complete BGV check for verification",
      "Set your schedule, board, class, subject",
      "Conduct live classes. Use AI tools for materials and exams.",
      "Monthly payouts. Transparent commission.",
    ],
  },
  careers: {
    heroTitle: 'Join Our Team',
    heroSubtitle: "Help us make quality education accessible to every child. We're building the future of learning—one student at a time.",
    perks: [
      { icon: '🏠', title: 'Remote-first', desc: 'Work from anywhere. No commute, more flexibility.' },
      { icon: '📚', title: 'Learning budget', desc: 'Grow your skills with courses and certifications.' },
      { icon: '⚡', title: 'Flexible hours', desc: 'Balance work and life on your terms.' },
      { icon: '🎯', title: 'Impact', desc: 'Change lives through education. Every day matters.' },
    ],
  },
  'role-config': {
    'for-parents': {
      image: '/images/parent-student-progress.png',
      emoji: '👨‍👩‍👧',
      floatEmojis: ['🛡️', '📊', '✅'],
      highlights: [
        { icon: '🛡️', title: 'AI Monitored Classes', desc: 'Every session monitored for safety. Peace of mind for you.' },
        { icon: '✅', title: 'Teachers Screened & BGV Checked', desc: 'Background verification and AI qualification for all teachers.' },
        { icon: '📊', title: 'Track Progress', desc: 'View schedules, attendance, and performance in one place.' },
        { icon: '📅', title: 'Flexible Scheduling', desc: "Reschedule when needed. Easy to manage your child's learning." },
      ],
      gradient: 'from-brand-50 via-white to-accent-50/40',
      border: 'border-brand-100',
    },
    'for-students': {
      image: '/images/kids-learning-home.png',
      emoji: '📚',
      floatEmojis: ['💡', '📝', '📱'],
      highlights: [
        { icon: '💬', title: 'Ask AI Anytime', desc: 'Stuck on a doubt? Get instant help 24/7 with our AI.' },
        { icon: '📝', title: 'AI Moderated Exams', desc: 'Fair evaluation. AI generates and grades—with human review if needed.' },
        { icon: '👤', title: 'One-to-One Attention', desc: 'Your teacher focuses only on you. No crowded classes.' },
        { icon: '📱', title: 'Learn Anywhere', desc: 'Use the app on phone or tablet. Learn from home or anywhere.' },
      ],
      gradient: 'from-accent-50/50 via-white to-brand-50/50',
      border: 'border-accent-100',
    },
    'for-teachers': {
      image: '/images/teacher-online.png',
      emoji: '👩‍🏫',
      floatEmojis: ['💰', '🤖', '📅'],
      highlights: [
        { icon: '✅', title: 'Verified & Trusted', desc: 'BGV check and AI exam build trust. Students come ready to learn.' },
        { icon: '💰', title: 'Fair Commission', desc: 'Transparent 10% commission. Payouts on time, every month.' },
        { icon: '🤖', title: 'AI Tools to Help', desc: 'AI materials, exam questions, doubt resolution. Teach smarter.' },
        { icon: '📅', title: 'Flexible Schedule', desc: 'Create batches that fit your availability. Teach from anywhere.' },
      ],
      gradient: 'from-brand-50/80 via-white to-accent-50/60',
      border: 'border-brand-200',
    },
  },
};
