import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { BrandLogo } from '@/components/BrandLogo';

export default function Register() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        {/* Header - Logo */}
        <div className="mb-8 flex justify-center">
          <BrandLogo size="large" iconSize={96} showTagline={true} className="justify-center" />
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-brand-800 sm:text-3xl">
          Create your account
        </h1>
        <p className="mb-10 text-center text-base text-brand-600 sm:text-lg">
          Choose how you&apos;d like to join GuruChakra
        </p>

        {/* Role cards - theme-aligned */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            to="/parent/register"
            className="card-funky group flex flex-col items-center gap-4 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-pink-200 hover:shadow-2xl"
          >
            <span className="text-6xl transition-transform duration-300 group-hover:scale-110 sm:text-7xl">
              👨‍👩‍👧‍👦
            </span>
            <h2 className="text-center text-xl font-bold text-brand-800 sm:text-2xl">
              Parent
            </h2>
            <p className="text-center text-sm text-brand-600">
              Find the best teachers for your child
            </p>
            <span className="btn-primary mt-2 inline-block">
              <span className="btn-text">Register as Parent</span>
            </span>
          </Link>

          <Link
            to="/teacher/register"
            className="card-funky group flex flex-col items-center gap-4 rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-2xl"
          >
            <span className="text-6xl transition-transform duration-300 group-hover:scale-110 sm:text-7xl">
              👩‍🏫
            </span>
            <h2 className="text-center text-xl font-bold text-brand-800 sm:text-2xl">
              Teacher
            </h2>
            <p className="text-center text-base text-brand-600">
              Share your expertise and earn
            </p>
            <span className="btn-primary mt-2 inline-block">
              <span className="btn-text">Register as Teacher</span>
            </span>
          </Link>
        </div>

        {/* Footer - Login link */}
        <p className="mt-10 text-center text-lg text-brand-700">
          Already have an account?{' '}
          <Link
            to="/login?from=register"
            className="font-bold text-brand-600 underline underline-offset-2 hover:underline"
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
