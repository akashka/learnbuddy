export default function NotFoundPage() {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3007';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-8xl mb-6 animate-bounce">🤖</div>
        <div className="inline-block px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
          404 · Page not found
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Lost in the learning galaxy?
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Our AI buddy couldn&apos;t find this page. Let&apos;s get you back to your learning adventure!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-xl"
          >
            🏠 Take me home
          </a>
          <a
            href={`${appUrl}/login`}
            className="px-6 py-3 rounded-2xl bg-white text-indigo-600 font-semibold border-2 border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            Open App
          </a>
        </div>
      </div>
    </div>
  );
}
