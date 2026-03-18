import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { BRAND } from '@shared/brand';
import { TrustBadges } from '@/components/TrustBadges';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-12">
      <section className="mb-12 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-8 text-center shadow-xl md:p-16">
        <div className="mb-6 flex justify-center">
          <img src="/logo.svg" alt={BRAND.name} width={120} height={120} className="animate-bounce-subtle" />
        </div>
        <h1 className="mb-2 text-4xl font-extrabold text-brand-800 md:text-6xl">
          {BRAND.name}
        </h1>
        <p className="mb-8 text-xl font-semibold text-brand-600 md:text-2xl">
          {BRAND.tagline}
        </p>
        <p className="mx-auto max-w-2xl text-brand-700/90">
          One-to-one online tuition for kids with AI monitoring. Safe, fun, and effective learning!
        </p>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-3">
        <Link
          to="/parent/register"
          className="group rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-8 text-center shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="mb-4 text-6xl transition-transform group-hover:scale-110">👨‍👩‍👧‍👦</div>
          <h2 className="mb-2 text-2xl font-bold text-brand-800">{t('parent')}</h2>
          <p className="mb-4 text-gray-600">Find the best teachers for your kids</p>
          <span className="inline-block rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700">
            {t('findTeacher')}
          </span>
        </Link>

        <Link
          to="/teacher/register"
          className="group rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="mb-4 text-6xl transition-transform group-hover:scale-110">👩‍🏫</div>
          <h2 className="mb-2 text-2xl font-bold text-green-800">{t('teacher')}</h2>
          <p className="mb-4 text-gray-600">Teach and earn from home</p>
          <span className="inline-block rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700">
            {t('becomeTeacher')}
          </span>
        </Link>

        <Link
          to="/login"
          className="group rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 p-8 text-center shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="mb-4 text-6xl transition-transform group-hover:scale-110">👦</div>
          <h2 className="mb-2 text-2xl font-bold text-brand-800">{t('student')}</h2>
          <p className="mb-4 text-gray-600">Join your classes and learn</p>
          <span className="inline-block rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700">
            {t('login')}
          </span>
        </Link>
      </section>

      <section className="mb-12 rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-brand-800">Why Choose Us?</h2>
        <TrustBadges variant="section" className="mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-4 rounded-2xl bg-brand-50 p-4 transition hover:bg-brand-100">
            <span className="text-4xl">🤖</span>
            <div>
              <h3 className="font-bold text-brand-800">AI Monitored</h3>
              <p className="text-sm text-gray-600">Safe learning with AI watching over your child</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl bg-brand-50 p-4 transition hover:bg-brand-100">
            <span className="text-4xl">📱</span>
            <div>
              <h3 className="font-bold text-brand-800">Use Any Device</h3>
              <p className="text-sm text-gray-600">Mobile, tablet, laptop or TV - learn anywhere</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl bg-brand-50 p-4 transition hover:bg-brand-100">
            <span className="text-4xl">🌍</span>
            <div>
              <h3 className="font-bold text-brand-800">Multiple Languages</h3>
              <p className="text-sm text-gray-600">Learn in your preferred language</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-brand-200 bg-brand-50/50 p-8 text-center">
        <p className="mb-4 text-lg text-brand-700">
          Admin is a separate app. Deploy admin at e.g. admin.yourdomain.com
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/for-you" className="text-brand-600 hover:underline">For You</Link>
          <Link to="/features" className="text-brand-600 hover:underline">Features</Link>
          <Link to="/how-it-works" className="text-brand-600 hover:underline">How It Works</Link>
          <Link to="/about-us" className="text-brand-600 hover:underline">About Us</Link>
          <Link to="/contact-us" className="text-brand-600 hover:underline">Contact Us</Link>
          <Link to="/faq" className="text-brand-600 hover:underline">FAQ</Link>
          <Link to="/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          <Link to="/terms-conditions" className="text-brand-600 hover:underline">Terms & Conditions</Link>
        </div>
      </section>
    </div>
  );
}
