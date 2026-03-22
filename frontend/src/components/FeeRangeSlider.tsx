import { formatCurrency } from '@shared/formatters';

interface FeeRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

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

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    if (v <= valueMax - step) onChange(v, valueMax);
    else onChange(valueMax - step, valueMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    if (v >= valueMin + step) onChange(valueMin, v);
    else onChange(valueMin, valueMin + step);
  };

  const minCloserToMax = valueMax - valueMin < step * 2;

  return (
    <div className="rounded-xl border border-gray-200/90 bg-gray-50/80 px-3.5 py-3.5 shadow-sm">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-600">
        <span>{formatCurrency(valueMin)}</span>
        <span>{formatCurrency(valueMax)}</span>
      </div>
      <div className="relative mt-4 h-10">
        {/* Track */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
        {/* Selected range */}
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
        />
        {/* Min thumb — higher z-index when thumbs overlap */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
          className={`fee-range-thumb absolute inset-x-0 top-1/2 h-10 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent ${minCloserToMax ? 'z-[3]' : 'z-[2]'}`}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
          className={`fee-range-thumb absolute inset-x-0 top-1/2 h-10 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent ${minCloserToMax ? 'z-[2]' : 'z-[3]'}`}
        />
      </div>
    </div>
  );
}
