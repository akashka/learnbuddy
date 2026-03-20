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
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-8 py-12">
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
            <p className="text-center text-base text-brand-600 sm:text-lg">{subtitle}</p>
          )}
      </div>

      {/* Form content */}
      <div className={`w-full px-4 ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
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
  );
}
