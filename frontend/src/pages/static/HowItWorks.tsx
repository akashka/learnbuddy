import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPageContent } from '@/lib/api';

const defaultFourSteps = [
  { step: 1, title: 'Choose', desc: 'Pick a teacher from our verified marketplace', icon: '👤' },
  { step: 2, title: 'Connect', desc: 'Book a slot and join live class from home', icon: '📱' },
  { step: 3, title: 'Learn', desc: 'One-to-one with AI monitoring for safety', icon: '📚' },
  { step: 4, title: 'Grow', desc: 'Track progress, get AI help, exams & feedback', icon: '📈' },
];

const defaultForParentsSteps = [
  "Download the app from Play Store or App Store",
  "Sign up as a parent and add your child's details (board, class, subject)",
  "Browse the marketplace. Filter by board, class, subject. Read reviews.",
  "Choose a batch, pay securely, and your child is enrolled",
  "Your child joins live one-to-one classes. AI monitors every session.",
];

const defaultForStudentsSteps = [
  "Log in with your student ID (set by your parent)",
  "View your classes and join live sessions",
  "Ask AI doubts anytime between classes",
  "Take AI-generated exams and track your progress",
];

const defaultForTeachersSteps = [
  "Register, complete profile, pass AI qualification exam",
  "Complete BGV check for verification",
  "Set your schedule, board, class, subject",
  "Conduct live classes. Use AI tools for materials and exams.",
  "Monthly payouts. Transparent commission.",
];

export default function HowItWorks() {
  const [fourSteps, setFourSteps] = useState(defaultFourSteps);
  const [forParentsSteps, setForParentsSteps] = useState(defaultForParentsSteps);
  const [forStudentsSteps, setForStudentsSteps] = useState(defaultForStudentsSteps);
  const [forTeachersSteps, setForTeachersSteps] = useState(defaultForTeachersSteps);
  const [heroTitle, setHeroTitle] = useState('How It Works');
  const [heroSubtitle, setHeroSubtitle] = useState("From finding a teacher to attending classes—here's your journey with LearnBuddy.");

  useEffect(() => {
    fetchPageContent('how-it-works')
      .then((res) => {
        const s = res.sections;
        if (Array.isArray(s.fourSteps) && s.fourSteps.length > 0) setFourSteps(s.fourSteps as typeof defaultFourSteps);
        if (Array.isArray(s.forParentsSteps) && s.forParentsSteps.length > 0) setForParentsSteps(s.forParentsSteps as string[]);
        if (Array.isArray(s.forStudentsSteps) && s.forStudentsSteps.length > 0) setForStudentsSteps(s.forStudentsSteps as string[]);
        if (Array.isArray(s.forTeachersSteps) && s.forTeachersSteps.length > 0) setForTeachersSteps(s.forTeachersSteps as string[]);
        if (s.heroTitle) setHeroTitle(s.heroTitle as string);
        if (s.heroSubtitle) setHeroSubtitle(s.heroSubtitle as string);
      })
      .catch(() => {});
  }, []);

  const gradients = [
    'from-brand-50 via-white to-accent-50/50',
    'from-accent-50/50 via-white to-brand-50',
    'from-brand-50/80 via-white to-accent-50/60',
    'from-accent-50/60 via-white to-brand-50/80',
  ];

  return (
    <div className="flex w-full flex-col items-center px-2 py-4 sm:px-4 sm:py-6 md:py-8">
      <section className="mb-8 w-full rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 text-center shadow-xl sm:mb-12 sm:rounded-3xl sm:p-8 md:p-12">
        <h1 className="mb-3 text-4xl font-extrabold text-brand-900 md:text-5xl">{heroTitle}</h1>
        <p className="text-xl text-gray-600">{heroSubtitle}</p>
      </section>

      <section className="mb-8 w-full sm:mb-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-brand-900 sm:text-3xl">Four simple steps to start learning</h2>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {fourSteps.map((item, i) => (
            <div key={i} className={`rounded-2xl border-2 border-brand-100 bg-gradient-to-br ${gradients[i]} p-6 shadow-lg`}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-2xl">{item.icon}</div>
              <h3 className="text-lg font-bold text-brand-900">{item.title}</h3>
              <p className="mt-2 text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-brand-900 md:text-3xl">For Parents</h2>
          <ol className="space-y-3 text-gray-700">
            {forParentsSteps.map((step, j) => (
              <li key={j} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{j + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link to="/for-parents" className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Learn more for parents</Link>
        </div>

        <div className="mb-6 rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50/70 via-white to-brand-50/50 p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-brand-900 md:text-3xl">For Students</h2>
          <ol className="space-y-3 text-gray-700">
            {forStudentsSteps.map((step, j) => (
              <li key={j} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-600">{j + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link to="/for-students" className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Learn more for students</Link>
        </div>

        <div className="mb-6 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-100/40 via-white to-accent-100/40 p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-brand-900 md:text-3xl">For Teachers</h2>
          <ol className="space-y-3 text-gray-700">
            {forTeachersSteps.map((step, j) => (
              <li key={j} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">{j + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link to="/for-teachers" className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Learn more for teachers</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50/50 p-6">
        <h3 className="text-xl font-bold text-brand-900">Explore more</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Home</Link>
          <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">Features</Link>
          <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">About Us</Link>
          <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">Contact Us</Link>
          <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">FAQ</Link>
        </div>
      </section>
    </div>
  );
}
