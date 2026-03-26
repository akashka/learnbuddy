interface ChartItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: ChartItem[];
  maxValue?: number;
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-brand-700">{item.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-brand-100">
            <div
              className="h-full rounded-lg transition-all duration-500"
              style={{
                width: `${Math.min(100, (item.value / max) * 100)}%`,
                backgroundColor: item.color || '#6366f1',
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold text-brand-800">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
