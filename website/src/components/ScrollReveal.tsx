import { useScrollReveal } from '@/hooks/useScrollReveal';

type Variant = 'fade-up' | 'fade-in' | 'scale' | 'slide-left' | 'slide-right';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}

export function ScrollReveal({ children, variant = 'fade-up', delay = 0, className = '' }: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`scroll-reveal scroll-reveal-${variant} ${isVisible ? 'scroll-reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
