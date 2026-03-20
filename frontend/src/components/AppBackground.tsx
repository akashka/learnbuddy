/**
 * Full-app background matching the login page: gradient, blur orbs, decorative icons.
 * Used as the base layer behind all content.
 */
export function AppBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-purple-50 to-pink-100" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-brand-400 blur-3xl animate-float" />
        <div className="absolute bottom-32 right-20 h-40 w-40 rounded-full bg-purple-400 blur-3xl animate-float stagger-2" />
        <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 blur-2xl animate-pulse-soft" />
      </div>
      <div className="absolute top-10 right-10 text-6xl opacity-20 animate-float pointer-events-none">📚</div>
      <div className="absolute bottom-20 left-10 text-5xl opacity-20 animate-float stagger-2 pointer-events-none">✨</div>
      <div className="absolute top-1/3 right-1/4 text-4xl opacity-15 animate-float stagger-3 pointer-events-none">🎓</div>
    </div>
  );
}
