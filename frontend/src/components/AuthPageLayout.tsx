import { BRAND } from '@shared/brand';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** When true, content area is wider (max-w-4xl) for multi-step forms */
  wide?: boolean;
  /** When false, content is not wrapped in card */
  card?: boolean;
}

export function AuthPageLayout({ children, title, subtitle, wide = false, card = true }: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Animated background - same as Copy */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 via-purple-50 to-pink-100" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-brand-400 blur-3xl animate-float" />
          <div className="absolute bottom-32 right-20 h-40 w-40 rounded-full bg-purple-400 blur-3xl animate-float stagger-2" />
          <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 blur-2xl animate-pulse-soft" />
        </div>
        <div className="absolute top-10 right-10 text-6xl opacity-20 animate-float">📚</div>
        <div className="absolute bottom-20 left-10 text-5xl opacity-20 animate-float stagger-2">✨</div>
        <div className="absolute top-1/3 right-1/4 text-4xl opacity-15 animate-float stagger-3">🎓</div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-8 px-4 py-12">
        {/* Logo + name + tagline */}
        <div className="animate-slide-up flex flex-col items-center gap-3 opacity-0 [animation-fill-mode:forwards]">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt={BRAND.name}
              className="h-16 w-16 animate-bounce-subtle sm:h-20 sm:w-20"
            />
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-800 sm:text-4xl">
                {BRAND.name}
              </h1>
              <p className="text-base font-medium text-brand-600 sm:text-lg">{BRAND.tagline}</p>
            </div>
          </div>
          {title && (
            <h2 className="text-center text-xl font-bold text-brand-800 sm:text-2xl">{title}</h2>
          )}
          {subtitle && (
            <p className="text-center text-sm text-brand-600">{subtitle}</p>
          )}
        </div>

        {/* Form content */}
        <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
          {card ? (
            <div className="card animate-slide-up opacity-0 [animation-delay:0.1s] [animation-fill-mode:forwards]">
              {children}
            </div>
          ) : (
            <div className="animate-slide-up opacity-0 [animation-delay:0.1s] [animation-fill-mode:forwards]">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
