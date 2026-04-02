import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SocialLinks } from '@/components/SocialLinks';
import { useWebsiteSettings } from '@/contexts/WebsiteSettingsContext';
import { fetchLandingData } from '@/lib/api';
import { submitContactForm, type ContactFormData } from '@/lib/api';
import ReCAPTCHA from 'react-google-recaptcha';

export default function ContactUs() {
  const websiteSettings = useWebsiteSettings();
  const [company, setCompany] = useState<{ contact?: { email: string; hours: string; responseTime: string } } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    fetchLandingData().then((d) => setCompany(d.company ?? null)).catch(() => setCompany(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const form = e.currentTarget;
    const data: ContactFormData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value || undefined,
      type: (form.elements.namedItem('type') as HTMLSelectElement).value as ContactFormData['type'],
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      recaptchaToken: recaptchaToken || '',
    };
    setSubmitting(true);
    try {
      await submitContactForm(data);
      setSubmitSuccess(true);
      form.reset();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    }
  };

  const contactEmail = company?.contact?.email ?? 'support@guruchakra.com';
  const responseTime = company?.contact?.responseTime ?? 'Typically within 24 hours';

  return (
    <div className="overflow-x-hidden">
      {/* Hero - no image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50/40 px-6 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-200/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-[10%] top-[20%] text-6xl opacity-20 animate-float sm:text-7xl">📧</div>
        <div className="pointer-events-none absolute left-[15%] bottom-[25%] text-5xl opacity-15 animate-float sm:text-6xl" style={{ animationDelay: '0.5s' }}>💬</div>
        <div className="relative mx-auto max-w-5xl">
          <ScrollReveal variant="fade-up">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              Have a question or feedback? We&apos;d love to hear from you. Our support team responds {responseTime.toLowerCase()}.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-8 sm:space-y-12">
          {/* Social media - prominent, full width on top */}
          <ScrollReveal variant="fade-up" delay={0}>
            <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent-50/40 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
              <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:right-10 sm:top-10 sm:text-7xl" style={{ animationDelay: '0.2s' }}>🔗</div>
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                  Reach us on social media
                </h2>
                <p className="mt-3 text-gray-700">
                  Follow us for updates, tips, and community. We respond quickly on our social channels.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <SocialLinks settings={websiteSettings} className="rounded-xl bg-white/80 p-3 shadow-sm" />
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Email + Call Center - grid of 2 */}
          <div className="grid gap-6 sm:grid-cols-2">
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-accent-100 bg-gradient-to-br from-accent-50/50 via-white to-brand-50/50 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
                <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:text-7xl" style={{ animationDelay: '0.3s' }}>✉️</div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-bold text-brand-900">Email</h2>
                  <a href={`mailto:${contactEmail}`} className="mt-2 inline-block text-lg font-medium text-brand-600 hover:text-brand-700">
                    {contactEmail}
                  </a>
                  <p className="mt-3 text-gray-700">
                    Drop us an email anytime. We&apos;re here to help with questions about your account or classes.
                  </p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="card-funky relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50/40 p-6 shadow-lg transition hover:shadow-xl sm:p-8">
                <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-25 animate-float sm:text-7xl" style={{ animationDelay: '0.4s' }}>📞</div>
                <div className="relative">
                  <h2 className="font-display text-2xl font-bold text-brand-900">Call Center</h2>
                  <a href={`tel:${websiteSettings.contactPhone.replace(/\s/g, '')}`} className="mt-2 inline-block text-lg font-medium text-brand-600 hover:text-brand-700">
                    {websiteSettings.contactPhone}
                  </a>
                  <p className="mt-3 text-gray-700">
                    {websiteSettings.contactHours} ({websiteSettings.contactDays})
                  </p>
                  <p className="mt-2 text-gray-600">
                    Prefer to speak with us? Our team is ready to assist during business hours.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact form - at end after email and call center */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="card-funky rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30 p-6 shadow-lg sm:p-8">
              <h2 className="font-display text-2xl font-bold text-brand-900">Send us a message</h2>
              <p className="mt-2 text-gray-600">Share your concerns, suggestions, or feedback.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
                )}
                {submitSuccess && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">Thank you! We&apos;ll get back to you soon.</div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                    <input name="name" type="text" required className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                    <input name="email" type="email" required className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="you@example.com" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <input name="phone" type="tel" className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Type *</label>
                    <select name="type" required className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400">
                      <option value="concern">Concern</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Subject *</label>
                  <input name="subject" type="text" required className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Brief subject" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Message *</label>
                  <textarea name="message" required rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" placeholder="Your message..." />
                </div>

                <div className="flex justify-start py-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>

                <button type="submit" disabled={submitting} className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          </ScrollReveal>

          {/* Explore more */}
          <ScrollReveal variant="fade-up" delay={250}>
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-accent-50/50 to-brand-50/50 p-6">
              <h3 className="font-display text-xl font-bold text-brand-900">Explore more</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/" className="rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition hover:bg-brand-700">
                  Home
                </Link>
                <Link to="/how-it-works" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  How It Works
                </Link>
                <Link to="/features" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  Features
                </Link>
                <Link to="/about-us" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  About Us
                </Link>
                <Link to="/faq" className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2 text-base font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-50">
                  FAQ
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
