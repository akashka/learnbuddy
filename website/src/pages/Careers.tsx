import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '@/components/ScrollReveal';
import { fetchJobPositions, submitJobApplication, fetchPageContent, type JobPosition } from '@/lib/api';
import { API_BASE } from '@/lib/api';

const defaultPerks = [
  { icon: '🏠', title: 'Remote-first', desc: 'Work from anywhere. No commute, more flexibility.' },
  { icon: '📚', title: 'Learning budget', desc: 'Grow your skills with courses and certifications.' },
  { icon: '⚡', title: 'Flexible hours', desc: 'Balance work and life on your terms.' },
  { icon: '🎯', title: 'Impact', desc: 'Change lives through education. Every day matters.' },
];

const JOB_GRADIENTS = [
  'from-brand-50 via-white to-accent-50/40',
  'from-accent-50/50 via-white to-brand-50/50',
  'from-brand-50/80 via-white to-accent-50/60',
  'from-accent-50/60 via-white to-brand-50/80',
];

function JobCard({ job, index, onApply }: { job: JobPosition; index: number; onApply: () => void }) {
  const gradient = JOB_GRADIENTS[index % JOB_GRADIENTS.length];
  return (
    <ScrollReveal variant="fade-up" delay={150 + index * 50}>
      <div className={`card-funky group relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br ${gradient} p-6 shadow-lg transition hover:border-brand-200 hover:shadow-xl sm:p-8`}>
        <div className="pointer-events-none absolute right-6 top-6 text-5xl opacity-20 animate-float sm:text-6xl" style={{ animationDelay: `${index * 0.2}s` }}>💼</div>
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100/50 text-2xl transition group-hover:scale-110">
                💼
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{job.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                    {job.team}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-brand-100">
                    {job.type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-50/80 px-3 py-1 text-sm font-medium text-gray-700">
                    <span className="text-accent-600">📍</span>
                    {job.location}
                  </span>
                </div>
                <p className="mt-4 text-gray-600 leading-relaxed">{job.description}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {job.jdUrl && (
              <a
                href={`${API_BASE}${job.jdUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span>📄</span>
                Download JD
              </a>
            )}
            <button
              type="button"
              onClick={onApply}
              className="btn-funky inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <span>✨</span>
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

export default function Careers() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [perks, setPerks] = useState(defaultPerks);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState<JobPosition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchJobPositions()
      .then((d) => setPositions(d.positions))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPageContent('careers')
      .then((res) => {
        const p = res.sections.perks;
        if (Array.isArray(p) && p.length > 0) setPerks(p as typeof defaultPerks);
      })
      .catch(() => {});
  }, []);

  const openApply = (job: JobPosition) => setApplyModal(job);
  const closeApply = () => {
    setApplyModal(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">💼</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>🚀</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              Join Our Team
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              Help us make quality education accessible to every child. We&apos;re building the future of learning—one student at a time.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="mailto:careers@learnbuddy.com?subject=Application%20from%20LearnBuddy%20Website"
                className="btn-funky rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-700"
              >
                Email Us
              </a>
              <Link
                to="/contact-us"
                className="btn-funky rounded-xl border-2 border-brand-200 bg-white px-6 py-3 font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
              >
                Contact Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Perks */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8">
          <ScrollReveal variant="fade-up" delay={0}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Why work with us
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={(i + 1) * 60}>
                <div className="card-funky group relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30 p-6 shadow-lg transition hover:border-brand-200 hover:shadow-xl sm:p-8">
                  <div className="pointer-events-none absolute right-4 top-4 text-5xl opacity-25 animate-float sm:text-6xl" style={{ animationDelay: `${i * 0.2}s` }}>{p.icon}</div>
                  <div className="relative">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100/50 text-2xl transition group-hover:scale-110">
                      {p.icon}
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{p.title}</h3>
                    <p className="mt-2 text-sm text-gray-700 sm:text-base">{p.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Openings */}
          <ScrollReveal variant="fade-up" delay={100}>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Open positions
            </h2>
          </ScrollReveal>
          <p className="text-lg text-gray-600">
            We&apos;re always looking for talented people. Don&apos;t see a fit? Reach out anyway!
          </p>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-48 animate-pulse rounded-xl bg-brand-100" />
            </div>
          ) : positions.length > 0 ? (
            <div className="space-y-6">
              {positions.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} onApply={() => openApply(job)} />
              ))}
            </div>
          ) : (
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="card-funky rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/50 to-accent-50/30 p-12 text-center">
                <p className="text-lg text-gray-600">No open positions at the moment.</p>
                <p className="mt-2 text-sm text-gray-500">Check back soon or reach out—we&apos;d love to hear from you!</p>
                <a
                  href="mailto:careers@learnbuddy.com?subject=General%20Inquiry"
                  className="btn-funky mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
                >
                  Get in Touch
                </a>
              </div>
            </ScrollReveal>
          )}

          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={250}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  Home
                </Link>
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  About Us
                </Link>
                <Link to="/our-team" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Our Team
                </Link>
                <Link to="/contact-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Contact Us
                </Link>
                <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  FAQ
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Apply modal */}
      {applyModal && (
        <ApplyModal
          job={applyModal}
          onClose={closeApply}
          submitting={submitting}
          setSubmitting={setSubmitting}
          submitError={submitError}
          setSubmitError={setSubmitError}
          submitSuccess={submitSuccess}
          setSubmitSuccess={setSubmitSuccess}
        />
      )}
    </div>
  );
}

function ApplyModal({
  job,
  onClose,
  submitting,
  setSubmitting,
  submitError,
  setSubmitError,
  submitSuccess,
  setSubmitSuccess,
}: {
  job: JobPosition;
  onClose: () => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
  submitSuccess: boolean;
  setSubmitSuccess: (v: boolean) => void;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('positionId', job.id);

    const resume = formData.get('resume') as File | null;
    if (!resume || resume.size === 0) {
      setSubmitError('Resume is required');
      return;
    }
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(resume.type)) {
      setSubmitError('Resume must be PDF or Word document');
      return;
    }
    if (resume.size > 10 * 1024 * 1024) {
      setSubmitError('Resume must be under 10MB');
      return;
    }

    setSubmitting(true);
    try {
      await submitJobApplication(formData);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <span className="text-5xl">✓</span>
            <h3 className="mt-4 text-xl font-bold text-brand-900">Application submitted!</h3>
            <p className="mt-2 text-gray-600">We'll review your application and get back to you soon.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-brand-100 bg-white p-6 shadow-xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-900">Apply for {job.title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
            <input
              name="phone"
              type="tel"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Resume * (PDF or Word, max 10MB)</label>
            <input
              name="resume"
              type="file"
              required
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cover letter (optional)</label>
            <textarea
              name="coverLetter"
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              placeholder="Tell us why you'd like to join..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
