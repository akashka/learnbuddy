import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPageContent } from '@/lib/api';

const defaultRoles = [
  { to: '/for-parents', title: 'For Parents', emoji: '👨‍👩‍👧', desc: 'Find qualified teachers, track progress, and give your child the best learning experience. AI-monitored for safety.', gradient: 'from-brand-50 via-white to-accent-50/40', border: 'border-brand-100', image: '/images/parent-student-progress.png', accent: '🎯' },
  { to: '/for-students', title: 'For Students', emoji: '📚', desc: 'One-to-one attention, ask AI anytime, AI-moderated exams. Learn from anywhere with the app.', gradient: 'from-accent-50/50 via-white to-brand-50/50', border: 'border-accent-100', image: '/images/kids-learning-home.png', accent: '✨' },
  { to: '/for-teachers', title: 'For Teachers', emoji: '👩‍🏫', desc: 'Teach on your terms. Fair pay, flexible schedule. AI tools to help you teach smarter.', gradient: 'from-brand-50/80 via-white to-accent-50/60', border: 'border-brand-200', image: '/images/teacher-online.png', accent: '💼' },
];

export default function ForYou() {
  const [roles, setRoles] = useState(defaultRoles);

  useEffect(() => {
    fetchPageContent('for-you')
      .then((res) => {
        const r = res.sections.roles as typeof defaultRoles;
        if (Array.isArray(r) && r.length > 0) setRoles(r);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex w-full flex-col items-center px-2 py-4 sm:px-4 sm:py-6 md:py-8">
      <section className="mb-8 w-full rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-6 text-center shadow-xl sm:mb-12 sm:rounded-3xl sm:p-8 md:p-12">
        <h1 className="mb-3 text-4xl font-extrabold text-brand-900 md:text-5xl">For You</h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-600">
          Whether you&apos;re a parent, student, or teacher—LearnBuddy has something for everyone.
        </p>
      </section>

      <section className="mb-8 w-full sm:mb-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-brand-900 sm:text-3xl">Choose your path</h2>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {roles.map((role) => (
            <Link
              key={role.to}
              to={role.to}
              className={`group block overflow-hidden rounded-2xl border-2 ${role.border} bg-gradient-to-br ${role.gradient} p-6 shadow-lg transition hover:shadow-xl`}
            >
              <div className="relative h-40 overflow-hidden sm:h-48">
                <img src={role.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <div className="absolute right-4 top-4 text-5xl opacity-90">{role.emoji}</div>
              </div>
              <div className="relative p-6">
                <h3 className="text-2xl font-bold text-brand-900">{role.title}</h3>
                <p className="mt-3 text-base text-gray-700">{role.desc}</p>
                <span className="mt-4 inline-flex items-center font-semibold text-brand-600 transition group-hover:underline">
                  Learn more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-accent-50/50 p-6">
        <h3 className="text-xl font-bold text-brand-900">Explore more</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700">Home</Link>
          <Link to="/how-it-works" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">How It Works</Link>
          <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">Features</Link>
          <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">About Us</Link>
          <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">Contact Us</Link>
          <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">FAQ</Link>
        </div>
      </section>
    </div>
  );
}
