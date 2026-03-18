import { Link } from 'react-router-dom';

interface GenericErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function GenericErrorPage({
  title = "Oops! Something went wobbly",
  message = "Our friendly AI helper got a little confused. Don't worry—we're on it! Try going back or refreshing the page.",
  onRetry,
}: GenericErrorPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-8">
          <div className="text-8xl mb-4 animate-bounce">🤖</div>
          <span className="absolute -top-2 -right-4 text-4xl animate-pulse">✨</span>
          <span className="absolute -bottom-2 -left-6 text-3xl animate-pulse" style={{ animationDelay: '200ms' }}>
            💡
          </span>
        </div>

        <div className="inline-block px-4 py-2 rounded-full bg-brand-100 text-brand-800 text-sm font-medium mb-6">
          Oops!
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          {title}
        </h1>
        <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {(onRetry || typeof window !== 'undefined') && (
            <button
              onClick={onRetry ?? (() => window.location.reload())}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white font-semibold hover:from-brand-600 hover:to-cyan-600 transition-all shadow-xl shadow-brand-200/50 hover:shadow-brand-300/50 hover:-translate-y-0.5"
            >
              🔄 Try again
            </button>
          )}
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-white text-brand-600 font-semibold border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50 transition-all"
          >
            🏠 Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
