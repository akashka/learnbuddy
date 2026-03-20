import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

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
      setOpen(false);
      return;
    }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await api(`/api/geocode/suggest?q=${encodeURIComponent(q.trim())}`);
      const data = (await res.json()) as { suggestions?: string[] };
      const list = data.suggestions ?? [];
      setSuggestions(list);
      setOpen(list.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
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
    setTimeout(() => setOpen(false), 200);
  };

  const handleFocus = () => {
    if (query.length >= 2 && suggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative overflow-visible ${className}`}>
      {label ? (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && ' *'}
        </label>
      ) : null}
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 ${inputClassName}`}
      />
      {open && (suggestions.length > 0 || loading) && (
        <ul
          className="absolute z-[100] mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-gray-500">Searching...</li>
          ) : (
            suggestions.map((s, i) => (
              <li
                key={`${s}-${i}`}
                role="option"
                tabIndex={0}
                className="cursor-pointer px-3 py-2 text-sm text-gray-800 hover:bg-brand-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
              >
                {s}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
