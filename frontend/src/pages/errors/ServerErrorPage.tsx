import { Link } from 'react-router-dom';

interface ServerErrorPageProps {
  statusCode?: number;
  message?: string;
}

export default function ServerErrorPage({ statusCode = 500, message }: ServerErrorPageProps) {
  const is5xx = statusCode >= 500;
  const title = is5xx ? "Our servers are taking a quick nap! 😴" : "Something went wrong";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-8">
          <div className="text-8xl mb-4 animate-pulse">
            {is5xx ? '🤖' : '😅'}
          </div>
          <span className="absolute -top-2 -right-4 text-4xl animate-bounce" style={{ animationDelay: '100ms' }}>
            ⚡
          </span>
          <span className="absolute -bottom-2 -left-6 text-3xl animate-bounce" style={{ animationDelay: '200ms' }}>
            🔧
          </span>
        </div>

        <div className="inline-block px-4 py-2 rounded-full bg-rose-100 text-rose-800 text-sm font-medium mb-6">
          {statusCode} · Server error
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          {title}
        </h1>
        <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
          {message || (
            <>
              Our AI helpers are working hard to fix things! Please try again in a moment. We promise we&apos;ll be back soon—learning never stops! 🌟
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-xl shadow-rose-200/50 hover:shadow-rose-300/50 hover:-translate-y-0.5"
          >
            🔄 Try again
          </button>
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-white text-brand-600 font-semibold border-2 border-brand-200 hover:border-brand-300 hover:bg-brand-50 transition-all"
          >
            🏠 Go home
          </Link>
        </div>

        <p className="mt-8 text-slate-500 text-sm">
          Still having trouble? <Link to="/contact-us" className="text-brand-500 hover:underline">Let us know</Link>
        </p>
      </div>
    </div>
  );
}
