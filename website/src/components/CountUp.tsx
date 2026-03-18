import { useState, useEffect, useRef } from 'react';

/** Parse value like "50K+", "4.9", "1M+" to a number for animation */
function parseStatValue(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned) || 0;
  if (value.includes('M') || value.includes('m')) return num * 1_000_000;
  if (value.includes('K') || value.includes('k')) return num * 1_000;
  return num;
}

/** Format number for display (e.g. 50000 -> "50K+") */
function formatForDisplay(n: number, suffix: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${Math.round(n)}${suffix}`;
}

interface CountUpProps {
  value: string;
  duration?: number;
  label: string;
  raw?: number;
}

export function CountUp({ value, duration = 1500, label, raw }: CountUpProps) {
  const [display, setDisplay] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const target = raw ?? parseStatValue(value);
  const suffix = value.includes('+') ? '+' : value.includes('%') ? '%' : '';
  const isDecimal = (typeof raw === 'number' && raw < 10 && raw % 1 !== 0) || (value.match(/^\d\.\d/) && !value.includes('K') && !value.includes('M'));

  useEffect(() => {
    if (hasAnimated) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    const start = 0;
    const end = isDecimal ? target : Math.round(target);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const current = start + (end - start) * eased;
      if (isDecimal || (target < 100 && target % 1 !== 0)) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(formatForDisplay(current, suffix));
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    requestAnimationFrame(tick);
  }, [hasAnimated, target, duration, value, isDecimal, suffix]);

  return (
    <div ref={ref}>
      <div className="font-display text-3xl font-bold text-white drop-shadow-sm transition group-hover:scale-110 sm:text-4xl">
        {hasAnimated ? display : '0'}
      </div>
      <div className="mt-2 text-sm font-medium text-white/90 sm:text-base">{label}</div>
    </div>
  );
}
