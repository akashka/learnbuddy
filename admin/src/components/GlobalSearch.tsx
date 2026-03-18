import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type GlobalSearchResult } from '@/lib/adminApi';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

const TYPE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  staff: 'User',
};

function getRoute(item: { _id: string; type: string; email?: string; name?: string }): string {
  switch (item.type) {
    case 'teacher':
      return `/teachers/${item._id}`;
    case 'parent':
      return `/parents/${item._id}`;
    case 'student':
      return `/students/${item._id}`;
    case 'staff':
      return `/users${item.email ? `?search=${encodeURIComponent(item.email)}` : ''}`;
    default:
      return '/dashboard';
  }
}

function ResultItem({
  item,
  type,
  onSelect,
  isActive,
}: {
  item: { _id: string; name?: string; email?: string; phone?: string; studentId?: string; parentName?: string };
  type: string;
  onSelect: () => void;
  isActive?: boolean;
}) {
  const subtitle = item.email || item.phone || item.studentId || item.parentName || '';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm focus:outline-none ${
        isActive ? 'bg-accent-100' : 'hover:bg-accent-100'
      }`}
    >
      <span className="font-medium text-accent-800">{item.name || item.email || '-'}</span>
      {subtitle && <span className="text-xs text-accent-600">{subtitle}</span>}
      <span className="text-xs text-accent-500">{TYPE_LABELS[type]}</span>
    </button>
  );
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runSearch = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await adminApi.search(q);
      setResults(data);
      setActiveIndex(-1);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query.trim()), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    setOpen(query.length >= MIN_QUERY_LENGTH && (loading || (results && hasAnyResults(results))));
  }, [query, loading, results]);

  const hasAnyResults = (r: GlobalSearchResult) =>
    r.teachers.length > 0 || r.parents.length > 0 || r.students.length > 0 || r.staff.length > 0;

  const flatResults = results
    ? [
        ...results.teachers.map((t) => ({ ...t, type: 'teacher' as const })),
        ...results.parents.map((p) => ({ ...p, type: 'parent' as const })),
        ...results.students.map((s) => ({ ...s, type: 'student' as const })),
        ...results.staff.map((s) => ({ ...s, type: 'staff' as const })),
      ]
    : [];

  const handleSelect = (item: { _id: string; type: string; email?: string; name?: string }) => {
    const route = getRoute(item);
    navigate(route);
    setQuery('');
    setResults(null);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < flatResults.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flatResults[activeIndex]) {
      e.preventDefault();
      handleSelect(flatResults[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 max-w-md" ref={panelRef}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= MIN_QUERY_LENGTH && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search teachers, parents, students, users..."
          className="w-full rounded-lg border border-accent-200 bg-accent-50/50 py-2 pl-9 pr-3 text-sm text-accent-800 placeholder-accent-400 focus:border-accent-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent-400"
          aria-label="Global search"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="global-search-results"
        />
      </div>

      {open && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-accent-200 bg-white shadow-lg"
        >
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-accent-600">Searching...</div>
          ) : query.length < MIN_QUERY_LENGTH ? (
            <div className="px-4 py-6 text-center text-sm text-accent-500">
              Type at least {MIN_QUERY_LENGTH} characters
            </div>
          ) : results && !hasAnyResults(results) ? (
            <div className="px-4 py-6 text-center text-sm text-accent-500">No results found</div>
          ) : (
            <div className="py-2">
              {results?.teachers.length ? (
                <div className="mb-1 px-2 py-1 text-xs font-medium text-accent-500">Teachers</div>
              ) : null}
              {results?.teachers.map((t, i) => (
                <ResultItem
                  key={`t-${t._id}`}
                  item={t}
                  type="teacher"
                  onSelect={() => handleSelect({ ...t, type: 'teacher' })}
                  isActive={flatResults.findIndex((r) => r._id === t._id && r.type === 'teacher') === activeIndex}
                />
              ))}
              {results?.parents.length ? (
                <div className="mb-1 mt-2 border-t border-accent-100 px-2 pt-2 text-xs font-medium text-accent-500">
                  Parents
                </div>
              ) : null}
              {results?.parents.map((p) => (
                <ResultItem
                  key={`p-${p._id}`}
                  item={p}
                  type="parent"
                  onSelect={() => handleSelect({ ...p, type: 'parent' })}
                />
              ))}
              {results?.students.length ? (
                <div className="mb-1 mt-2 border-t border-accent-100 px-2 pt-2 text-xs font-medium text-accent-500">
                  Students
                </div>
              ) : null}
              {results?.students.map((s) => (
                <ResultItem
                  key={`s-${s._id}`}
                  item={s}
                  type="student"
                  onSelect={() => handleSelect({ ...s, type: 'student' })}
                  isActive={flatResults.findIndex((r) => r._id === s._id && r.type === 'student') === activeIndex}
                />
              ))}
              {results?.staff.length ? (
                <div className="mb-1 mt-2 border-t border-accent-100 px-2 pt-2 text-xs font-medium text-accent-500">
                  Users
                </div>
              ) : null}
              {results?.staff.map((s) => (
                <ResultItem
                  key={`st-${s._id}`}
                  item={s}
                  type="staff"
                  onSelect={() => handleSelect({ ...s, type: 'staff' })}
                  isActive={flatResults.findIndex((r) => r._id === s._id && r.type === 'staff') === activeIndex}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
