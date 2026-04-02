import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@shared/formatters';

interface FeeRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

/**
 * Dual-thumb fee range: custom visual track + hidden native inputs for keyboard access.
 * Native <input type="range"> handles Arrow/Home/End/PageUp/PageDown (WCAG 2.1.1).
 * The visual thumbs are pointer-events:none decorations only.
 */
export function FeeRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 500,
}: FeeRangeSliderProps) {
  const span = max - min || 1;
  const leftPct = ((valueMin - min) / span) * 100;
  const rightPct = ((valueMax - min) / span) * 100;

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'min' | 'max' | null>(null);
  const valueMinRef = useRef(valueMin);
  const valueMaxRef = useRef(valueMax);
  valueMinRef.current = valueMin;
  valueMaxRef.current = valueMax;

  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const snap = useCallback(
    (raw: number) => {
      const s = Math.round((raw - min) / step) * step + min;
      return Math.max(min, Math.min(max, s));
    },
    [min, max, step]
  );

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snap(min + pct * span);
    },
    [min, span, snap]
  );

  const applyMin = useCallback(
    (v: number | null) => {
      if (v === null) return;
      const vmax = valueMaxRef.current;
      const nextMin = Math.max(min, Math.min(v, vmax - step));
      if (nextMin !== valueMinRef.current) onChange(nextMin, vmax);
    },
    [min, step, onChange]
  );

  const applyMax = useCallback(
    (v: number | null) => {
      if (v === null) return;
      const vmin = valueMinRef.current;
      const nextMax = Math.min(max, Math.max(v, vmin + step));
      if (nextMax !== valueMaxRef.current) onChange(vmin, nextMax);
    },
    [max, step, onChange]
  );

  const pickThumb = useCallback(
    (clientX: number): 'min' | 'max' => {
      const el = trackRef.current;
      if (!el) return 'min';
      const rect = el.getBoundingClientRect();
      const w = rect.width || 1;
      const clickPct = ((clientX - rect.left) / w) * 100;
      const distMin = Math.abs(clickPct - leftPct);
      const distMax = Math.abs(clickPct - rightPct);
      return distMin <= distMax ? 'min' : 'max';
    },
    [leftPct, rightPct]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const thumb = pickThumb(e.clientX);
    draggingRef.current = thumb;
    setDragging(thumb);
    const v = valueFromClientX(e.clientX);
    if (thumb === 'min') applyMin(v);
    else applyMax(v);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = draggingRef.current;
    if (!d) return;
    const v = valueFromClientX(e.clientX);
    if (d === 'min') applyMin(v);
    else applyMax(v);
  };

  const endDrag = useCallback(() => {
    draggingRef.current = null;
    setDragging(null);
  }, []);

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    endDrag();
  };

  useEffect(() => {
    window.addEventListener('blur', endDrag);
    return () => window.removeEventListener('blur', endDrag);
  }, [endDrag]);

  return (
    <div className="rounded-xl border border-gray-200/90 bg-gray-50/80 px-3.5 py-3.5 shadow-sm">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-600" aria-hidden="true">
        <span>{formatCurrency(valueMin)}</span>
        <span>{formatCurrency(valueMax)}</span>
      </div>
      {/* Screen-reader summary of current range */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Fee range: {formatCurrency(valueMin)} to {formatCurrency(valueMax)}
      </div>
      <div
        ref={trackRef}
        role="group"
        aria-label={`Fee range from ${formatCurrency(valueMin)} to ${formatCurrency(valueMax)}`}
        className={`relative mt-4 h-10 touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Track */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" aria-hidden="true" />
        {/* Selected range */}
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
          aria-hidden="true"
        />
        {/* Visual min thumb (decorative) */}
        <div
          className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow-md"
          style={{ left: `${leftPct}%` }}
          aria-hidden="true"
        />
        {/* Visual max thumb (decorative) */}
        <div
          className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow-md"
          style={{ left: `${rightPct}%` }}
          aria-hidden="true"
        />
        {/* Hidden native min range input — provides keyboard access (WCAG 2.1.1) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) => applyMin(Number(e.target.value))}
          aria-label="Minimum fee"
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-valuenow={valueMin}
          aria-valuetext={formatCurrency(valueMin)}
          className="fee-range-thumb absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 2 }}
        />
        {/* Hidden native max range input — provides keyboard access (WCAG 2.1.1) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) => applyMax(Number(e.target.value))}
          aria-label="Maximum fee"
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={formatCurrency(valueMax)}
          className="fee-range-thumb absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ zIndex: 3 }}
        />
      </div>
    </div>
  );
}

