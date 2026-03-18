import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Floating decorative elements */}
        <div className="relative mb-8">
          <div className="text-8xl mb-4 animate-bounce" style={{ animationDelay: '0ms' }}>
            🤖
          </div>
          <span className="absolute -top-2 -right-4 text-4xl animate-pulse">🔍</span>
          <span className="absolute -bottom-2 -left-6 text-3xl animate-pulse" style={{ animationDelay: '300ms' }}>
            ✨
          </span>
        </div>

        <div className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
          404 · Page not found
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Lost in the learning galaxy?
        </h1>
        <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
          Our AI buddy couldn&apos;t find this page. Maybe it wandered off to explore! Let&apos;s get you back to your learning adventure.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-500 text-white font-semibold hover:from-brand-600 hover:to-purple-600 transition-all shadow-xl shadow-brand-200/50 hover:shadow-brand-300/50 hover:-translate-y-0.5"
          >
            🏠 Take me home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl bg-white text-brand-600 font-semibold border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50 transition-all"
          >
            ← Go back
          </button>
        </div>

        <p className="mt-8 text-slate-500 text-sm">
          Need help? <Link to="/contact-us" className="text-brand-500 hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
