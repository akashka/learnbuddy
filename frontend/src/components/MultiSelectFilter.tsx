interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  maxHeight = 'max-h-56',
}: MultiSelectFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} selected`;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</label>
      <details className="group">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-xl border border-gray-200/90 bg-gray-50/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm transition hover:border-brand-200 hover:bg-white focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20">
          <span className="min-w-0 flex-1 truncate pr-2">{displayText}</span>
          <svg className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className={`mt-1.5 overflow-y-auto rounded-xl border border-gray-200 bg-white ${maxHeight} shadow-lg`}>
          {options.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">No options</p>
          ) : (
            <ul className="py-1.5">
              {options.map((opt) => (
                <li key={opt}>
                  <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-brand-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggle(opt)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-gray-900">{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
