import { useRef } from 'react';

export type FilterOption = { value: string; label: string };

export function FilterBar({
  searchPlaceholder,
  search,
  onSearchChange,
  filters = [],
  sortOptions = [],
  sort,
  order,
  onSortChange,
  onOrderChange,
  extra,
}: {
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  filters?: { key: string; label: string; options: FilterOption[]; value: string; onChange: (v: string) => void }[];
  sortOptions?: FilterOption[];
  sort?: string;
  order?: 'asc' | 'desc';
  onSortChange?: (v: string) => void;
  onOrderChange?: (v: 'asc' | 'desc') => void;
  extra?: React.ReactNode;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {searchPlaceholder != null && onSearchChange != null && (
        <input
          ref={searchRef}
          type="text"
          placeholder={searchPlaceholder}
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-64 rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      )}
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {sortOptions.length > 0 && onSortChange && (
        <>
          <select
            value={sort ?? ''}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {onOrderChange && (
            <select
              value={order ?? 'desc'}
              onChange={(e) => onOrderChange(e.target.value as 'asc' | 'desc')}
              className="rounded-lg border border-accent-200 px-3 py-2 text-sm"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          )}
        </>
      )}
      {extra}
    </div>
  );
}
