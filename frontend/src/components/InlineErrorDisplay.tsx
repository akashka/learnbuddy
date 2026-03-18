import { Link } from 'react-router-dom';
import { ApiError } from '@/lib/api';

interface InlineErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  /** When true, shows full-page style for 5xx/404 from API */
  fullPage?: boolean;
}

export function InlineErrorDisplay({ error, onRetry, fullPage }: InlineErrorDisplayProps) {
  const err = typeof error === 'string' ? new Error(error) : error;
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 0;
  const is5xx = statusCode >= 500;
  const is404 = statusCode === 404;

  if (fullPage && (is5xx || is404)) {
    if (is404) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="max-w-md w-full text-center p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Couldn&apos;t find this</h2>
            <p className="text-slate-600 mb-4">Our AI buddy looked everywhere but this doesn&apos;t exist. Maybe it was moved?</p>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600">
                  Try again
                </button>
              )}
              <Link to="/" className="px-4 py-2 rounded-xl bg-white text-amber-700 font-medium border-2 border-amber-200 hover:bg-amber-50">
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    if (is5xx) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="max-w-md w-full text-center p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Our servers are resting!</h2>
            <p className="text-slate-600 mb-4">Our AI helpers are fixing things. Please try again in a moment. 🌟</p>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button onClick={onRetry} className="px-4 py-2 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600">
                  Try again
                </button>
              )}
              <Link to="/" className="px-4 py-2 rounded-xl bg-white text-rose-700 font-medium border-2 border-rose-200 hover:bg-rose-50">
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-cyan-50 border-2 border-brand-200 p-6 text-center">
      <div className="text-5xl mb-3">🤖</div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Oops! Something went wobbly</h2>
      <p className="text-slate-600 mb-4">
        {err.message || 'Our friendly AI got confused. Give it another try!'}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-white text-brand-600 font-medium border-2 border-brand-200 hover:bg-brand-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
