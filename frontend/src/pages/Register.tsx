import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrustBadges } from '@/components/TrustBadges';

export default function Register() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Choose your role</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/parent/register"
          className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 p-8 text-center shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
        >
          <div className="mb-4 text-5xl">👨‍👩‍👧‍👦</div>
          <h2 className="mb-2 text-xl font-bold text-blue-800">{t('parent')}</h2>
          <p className="text-gray-600">Register as a parent to find teachers for your kids</p>
          <span className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {t('register')} as Parent
          </span>
        </Link>
        <Link
          to="/teacher/register"
          className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 p-8 text-center shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
        >
          <div className="mb-4 text-5xl">👩‍🏫</div>
          <h2 className="mb-2 text-xl font-bold text-brand-800">{t('teacher')}</h2>
          <p className="text-gray-600">Register as a teacher to teach and earn</p>
          <span className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {t('register')} as Teacher
          </span>
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-brand-600 hover:underline">{t('login')}</Link>
      </p>
      <TrustBadges variant="compact" className="mt-6" />
    </div>
  );
}
