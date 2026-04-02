import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student, Teacher, WebsitePageContent } from '@/lib/models';
import { ClassSession } from '@/lib/models/ClassSession';
import { BRAND, COMPANY } from '@/lib/brand';
import { WEBSITE_PAGE_CONTENT_SEED } from '@/lib/website-page-content-seed';

/** Public: Get website landing content (stats, reviews, features, company). No auth required. */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'en';
    const data = await getLandingData(lang);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Website landing fetch error:', error);
    return NextResponse.json(getLandingDataFallback());
  }
}

async function getLandingSectionsFromDB(lang: string) {
  const doc = await WebsitePageContent.findOne({ pageType: 'landing-sections' }).lean();
  const sections = (doc?.translations as any)?.[lang] || doc?.sections || WEBSITE_PAGE_CONTENT_SEED['landing-sections'];
  return sections as Record<string, unknown>;
}

function formatStatValue(n: number, suffix = ''): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${n}${suffix}`;
}

async function getLandingData(lang: string) {
  const fallback = getLandingDataFallback();
  try {
    await connectDB();
    const [studentsCount, teachersCount, classesCompleted, sections] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      ClassSession.countDocuments({ status: 'completed' }),
      getLandingSectionsFromDB(lang),
    ]);
    const stats = [
      { value: formatStatValue(studentsCount, '+'), label: 'Students Learning', raw: studentsCount },
      { value: formatStatValue(teachersCount, '+'), label: 'Expert Teachers', raw: teachersCount },
      { value: formatStatValue(classesCompleted, '+'), label: 'Classes Completed', raw: classesCompleted },
      { value: '4.9', label: 'App Rating', raw: 4.9 },
    ];
    const reviews = (sections.reviews as typeof fallback.reviews) ?? fallback.reviews;
    return {
      ...fallback,
      stats,
      reviews,
      howItWorks: (sections.howItWorks as typeof fallback.howItWorks) ?? fallback.howItWorks,
      benefits: (sections.benefits as typeof fallback.benefits) ?? fallback.benefits,
      aiFeatures: (sections.aiFeatures as typeof fallback.aiFeatures) ?? fallback.aiFeatures,
      roleCards: (sections.roleCards as typeof fallback.roleCards) ?? fallback.roleCards,
    };
  } catch {
    return fallback;
  }
}

function getLandingDataFallback() {
  const sections = WEBSITE_PAGE_CONTENT_SEED['landing-sections'] as Record<string, unknown>;
  return {
    brand: { name: BRAND.name, tagline: BRAND.tagline },
    company: {
      vision: COMPANY.vision,
      mission: COMPANY.mission,
      descriptionShort: COMPANY.descriptionShort,
      descriptionLong: COMPANY.descriptionLong,
      values: COMPANY.values,
      differentiators: COMPANY.differentiators,
      contact: COMPANY.contact,
    },
    stats: [
      { value: '50K+', label: 'Students Learning', raw: 50000 },
      { value: '2,500+', label: 'Expert Teachers', raw: 2500 },
      { value: '1M+', label: 'Classes Completed', raw: 1000000 },
      { value: '4.9', label: 'App Rating', raw: 4.9 },
    ],
    howItWorks: sections.howItWorks ?? [
      { step: 1, title: 'Choose', desc: 'Pick a teacher from our verified marketplace', icon: '👤' },
      { step: 2, title: 'Connect', desc: 'Book a slot and join live class from home', icon: '📱' },
      { step: 3, title: 'Learn', desc: 'One-to-one with AI monitoring for safety', icon: '📚' },
      { step: 4, title: 'Grow', desc: 'Track progress, get AI help, exams & feedback', icon: '📈' },
    ],
    benefits: sections.benefits ?? [
      { icon: '🏠', title: 'Learn from Home', desc: 'No commute. Safe, comfortable learning.' },
      { icon: '🤖', title: 'AI Monitored', desc: 'Every class is safe. AI watches over.' },
      { icon: '💬', title: 'Ask AI Anytime', desc: '24/7 doubt help. Instant answers.' },
      { icon: '📊', title: 'Track Progress', desc: 'Parents see growth. Real-time reports.' },
    ],
    aiFeatures: sections.aiFeatures ?? [
      { title: 'Class Monitoring', desc: 'AI watches every session for safety & quality' },
      { title: 'Exam Generation', desc: 'Smart tests tailored to your syllabus' },
      { title: 'Instant Doubt Help', desc: 'Ask anything—AI explains like a friend' },
      { title: 'Study Materials', desc: 'AI creates notes, summaries, practice' },
    ],
    roleCards: sections.roleCards ?? [
      { to: '/for-parents', title: 'Parents', image: '/images/parent-student-progress.png', desc: 'Track progress, find teachers, peace of mind with AI monitoring.' },
      { to: '/for-students', title: 'Students', image: '/images/kids-learning-home.png', desc: 'Learn from home with AI help. Ask doubts anytime. Grow faster.' },
      { to: '/for-teachers', title: 'Teachers', image: '/images/teacher-online.png', desc: 'Teach on your terms. Flexible. Fair pay. AI tools to help.' },
    ],
    reviews: (sections.reviews as Array<{ name: string; role: string; text: string; rating: number }>) ?? [
      {
        name: 'Priya S.',
        role: 'Parent',
        text: 'My daughter improved from C to A in Maths within 3 months. The AI monitoring gives me peace of mind. Highly recommend!',
        rating: 5,
      },
      {
        name: 'Rahul M.',
        role: 'Parent',
        text: 'Teachers are screened and verified. The one-to-one attention has made a huge difference for my son. Best investment in education.',
        rating: 5,
      },
      {
        name: 'Anita K.',
        role: 'Teacher',
        text: 'Flexible schedule, fair pay, and the platform handles everything. I can focus on teaching. The AI tools help me personalize lessons.',
        rating: 5,
      },
      {
        name: 'Vikram R.',
        role: 'Parent',
        text: 'Ask AI anytime feature is a game-changer. My child gets instant help with doubts. DPDP compliant and safe for kids.',
        rating: 5,
      },
      {
        name: 'Meera P.',
        role: 'Parent',
        text: 'Good platform overall. Sometimes the app is a bit slow, but teachers are great and my child is learning well.',
        rating: 4,
      },
      {
        name: 'Arjun D.',
        role: 'Teacher',
        text: 'Decent earnings. Would like more flexibility in scheduling. Support team is helpful when I need them.',
        rating: 4,
      },
      {
        name: 'Kavita N.',
        role: 'Parent',
        text: 'Started well. Had a small issue with a class reschedule but it was resolved quickly. Happy with the progress.',
        rating: 4,
      },
    ],
    features: [
      {
        icon: 'shield',
        title: 'DPDP Compliant & Safe',
        description: 'Full compliance with India\'s Digital Personal Data Protection Act. Your child\'s data is protected.',
      },
      {
        icon: 'ai',
        title: 'AI Monitored Sessions',
        description: 'Every class and exam is AI-monitored for safety and quality. Parents get peace of mind.',
      },
      {
        icon: 'chat',
        title: 'Ask AI Anytime',
        description: 'Students can ask doubts 24/7. AI-powered study materials and instant answers.',
      },
      {
        icon: 'exam',
        title: 'AI Moderated Exams',
        description: 'Fair, unbiased exam evaluation. AI generates and grades tests with human review option.',
      },
      {
        icon: 'verified',
        title: 'Teachers Screened & BGV Checked',
        description: 'Every teacher undergoes background verification. AI qualification exam ensures quality.',
      },
      {
        icon: 'mobile',
        title: 'Learn Anywhere',
        description: 'Mobile app for iOS and Android. Learn from home, travel, or anywhere with internet.',
      },
    ],
  };
}
