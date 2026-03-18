import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '@/lib/api';

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export function LocationSearch({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Search for an address...',
  required = false,
  className = '',
  inputClassName = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/geocode/suggest?q=${encodeURIComponent(q.trim())}`);
      const data = (await res.json()) as { suggestions?: string[] };
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  const handleSelect = (s: string) => {
    setQuery(s);
    onChange(s);
    setOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-accent-700">
          {label}
          {required && ' *'}
        </label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400 ${inputClassName}`}
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-accent-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s}-${i}`}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-sm text-accent-800 hover:bg-accent-50"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      {loading && query.length >= 2 && (
        <span className="absolute right-3 top-9 text-xs text-accent-500">Searching...</span>
      )}
    </div>
  );
}
