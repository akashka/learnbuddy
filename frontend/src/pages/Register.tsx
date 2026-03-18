import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Register() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-[calc(100vh-6rem)] flex-col overflow-hidden">
      {/* Header - Logo */}
      <div className="absolute left-0 right-0 top-6 z-10 flex justify-center px-4">
        <Link to="/login" className="flex items-center gap-2">
          <img src="/logo.svg" alt="LearnBuddy" className="h-12 w-12 sm:h-14 sm:w-14" />
          <span className="font-display text-xl font-bold text-white drop-shadow-md sm:text-2xl">
            LearnBuddy
          </span>
        </Link>
      </div>

      {/* Split layout: Parent (pink) | Teacher (blue) - Copy style */}
      <div className="flex min-h-screen flex-1 flex-col md:flex-row">
        {/* Parent side - Pink */}
        <Link
          to="/parent/register"
          className="group relative flex min-h-[45vh] flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 p-6 transition-all duration-300 md:min-h-screen md:gap-6 md:p-8 md:hover:flex-[1.1] md:hover:from-pink-500 md:hover:via-rose-500 md:hover:to-pink-600"
        >
          <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/5" />
          <span className="relative z-10 text-7xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110 md:text-8xl">
            👨‍👩‍👧‍👦
          </span>
          <span className="relative z-10 text-center text-xl font-bold text-white drop-shadow-md md:text-2xl">
            Parent
          </span>
          <span className="relative z-10 text-center text-sm font-medium text-white/90 drop-shadow-sm">
            Find the best teachers for your child
          </span>
          <span className="btn-text relative z-10 rounded-2xl border-2 border-white bg-white/20 px-8 py-4 font-bold text-white shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
            Register as Parent
          </span>
        </Link>

        {/* Teacher side - Blue */}
        <Link
          to="/teacher/register"
          className="group relative flex min-h-[45vh] flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-500 p-6 transition-all duration-300 md:min-h-screen md:gap-6 md:p-8 md:hover:flex-[1.1] md:hover:from-blue-500 md:hover:via-indigo-500 md:hover:to-blue-600"
        >
          <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/5" />
          <span className="relative z-10 text-7xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110 md:text-8xl">
            👩‍🏫
          </span>
          <span className="relative z-10 text-center text-xl font-bold text-white drop-shadow-md md:text-2xl">
            Teacher
          </span>
          <span className="relative z-10 text-center text-sm font-medium text-white/90 drop-shadow-sm">
            Share your expertise and earn
          </span>
          <span className="btn-text relative z-10 rounded-2xl border-2 border-white bg-white/20 px-8 py-4 font-bold text-white shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
            Register as Teacher
          </span>
        </Link>
      </div>

      {/* Footer - Login link */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
        <p className="text-sm text-white/90 drop-shadow-md">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-white underline decoration-2 underline-offset-2 hover:decoration-white/80"
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
