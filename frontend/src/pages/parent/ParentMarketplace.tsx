import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { FilterSidebar } from '@/components/FilterSidebar';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { FeeRangeSlider } from '@/components/FeeRangeSlider';
import { useWishlist } from '@/hooks/useWishlist';
import TeacherMarketplaceCard from '@/components/TeacherMarketplaceCard';

interface Teacher {
  _id: string;
  name?: string;
  photoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  experienceMonths?: number;
  board?: string[];
  classes?: string[];
  subjects?: string[];
  averageRating?: number | null;
  reviewCount?: number;
  feeStartsFrom?: number;
  bgvVerified?: boolean;
  documents?: { name?: string; verified?: boolean }[];
  batches?: { name?: string; subject?: string; board?: string; classLevel?: string; startDate?: string }[];
}

interface Masters {
  boards?: string[];
  classes?: string[];
  subjects?: string[];
  mappings?: { board: string; classLevel: string; subjects?: string[] }[];
}

interface MarketplaceResponse {
  teachers: Teacher[];
  total: number;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Recommended', icon: '⭐' },
  { value: 'ratings', label: 'Top Rated', icon: '🌟' },
  { value: 'cost_asc', label: 'Price: Low to High', icon: '₹' },
  { value: 'cost_desc', label: 'Price: High to Low', icon: '₹' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = ['08:00', '09:00', '10:00', '14:00', '16:00', '18:00', '19:00', '20:00'];

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '6', label: '6+ months' },
  { value: '12', label: '1+ year' },
  { value: '24', label: '2+ years' },
  { value: '36', label: '3+ years' },
  { value: '60', label: '5+ years' },
];

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Gujarati'];

const FEE_MIN = 0;
const FEE_MAX = 20000;
const PAGE_SIZE = 24;

function parseArrayParam(param: string | null): string[] {
  if (!param) return [];
  return param.split(',').map((s) => s.trim()).filter(Boolean);
}

function buildMarketplaceUrl(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '' && v !== 'all') {
      if (Array.isArray(v)) sp.set(k, v.join(','));
      else sp.set(k, String(v));
    }
  });
  return `/api/teachers/marketplace${sp.toString() ? `?${sp.toString()}` : ''}`;
}

export default function ParentMarketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [masters, setMasters] = useState<Masters | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const { t } = useLanguage();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const boardParam = searchParams.get('board') || '';
  const classParam = searchParams.get('class') || '';
  const subjectParam = searchParams.get('subject') || '';
  const dayParam = searchParams.get('day') || '';
  const timeParam = searchParams.get('time') || '';
  const languageParam = searchParams.get('languages') || '';
  const boards = parseArrayParam(boardParam);
  const classes = parseArrayParam(classParam);
  const subjects = parseArrayParam(subjectParam);
  const days = parseArrayParam(dayParam);
  const times = parseArrayParam(timeParam);
  const sort = searchParams.get('sort') || 'relevance';
  const search = searchParams.get('search') || '';
  const minFee = parseInt(searchParams.get('minFee') || String(FEE_MIN), 10);
  const maxFee = parseInt(searchParams.get('maxFee') || String(FEE_MAX), 10);
  const batchStartFrom = searchParams.get('batchStartFrom') || '';
  const bgvVerified = searchParams.get('bgvVerified') === 'true';
  const minExperience = searchParams.get('minExperience') || '';
  const languages = parseArrayParam(languageParam);
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput) next.set('search', searchInput);
          else next.delete('search');
          next.delete('offset');
          return next;
        });
      }
    }, 300);
    return () => { clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParam = (key: string, value: string | number | string[]) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else if (Array.isArray(value)) {
        if (value.length) next.set(key, value.join(','));
        else next.delete(key);
      } else {
        next.set(key, String(value));
      }
      next.delete('offset');
      return next;
    });
  };

  const fetchMasters = useCallback(async () => {
    try {
      const res = await apiJson<Masters>('/api/board-class-subjects');
      setMasters(res);
    } catch {
      setMasters({ boards: [], classes: [], subjects: [] });
    }
  }, []);

  const marketplaceQueryKey = useMemo(
    () =>
      JSON.stringify({
        boardParam,
        classParam,
        subjectParam,
        dayParam,
        timeParam,
        sort,
        search,
        minFee,
        maxFee,
        batchStartFrom,
        bgvVerified,
        minExperience,
        languageParam,
        retryNonce,
      }),
    [
      boardParam,
      classParam,
      subjectParam,
      dayParam,
      timeParam,
      sort,
      search,
      minFee,
      maxFee,
      batchStartFrom,
      bgvVerified,
      minExperience,
      languageParam,
      retryNonce,
    ]
  );

  const buildParams = useCallback(
    (offset: number): Record<string, string | number | undefined> => ({
      board: boardParam || undefined,
      class: classParam || undefined,
      subject: subjectParam || undefined,
      day: dayParam || undefined,
      time: timeParam || undefined,
      sort,
      search: search || undefined,
      minFee: minFee > FEE_MIN ? minFee : undefined,
      maxFee: maxFee < FEE_MAX ? maxFee : undefined,
      batchStartFrom: batchStartFrom || undefined,
      bgvVerified: bgvVerified ? 'true' : undefined,
      minExperience: minExperience || undefined,
      languages: languageParam || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [
      boardParam,
      classParam,
      subjectParam,
      dayParam,
      timeParam,
      sort,
      search,
      minFee,
      maxFee,
      batchStartFrom,
      bgvVerified,
      minExperience,
      languageParam,
    ]
  );

  useEffect(() => {
    fetchMasters();
  }, [fetchMasters]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setTeachers([]);
    setTotal(0);
    const params = buildParams(0);
    apiJson<MarketplaceResponse>(buildMarketplaceUrl(params), { signal: ac.signal })
      .then((res) => {
        setTeachers(res.teachers);
        setTotal(res.total);
      })
      .catch((e) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(e instanceof Error ? e : String(e));
      })
      .finally(() => {
        setLoading(false);
      });

    return () => ac.abort();
  }, [marketplaceQueryKey, buildParams]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  const loadMoreTeachers = useCallback((): Promise<void> => {
    if (loading || loadingMore || teachers.length >= total) {
      return Promise.resolve();
    }
    setLoadingMore(true);
    loadingMoreRef.current = true;
    setError(null);
    const params = buildParams(teachers.length);
    return apiJson<MarketplaceResponse>(buildMarketplaceUrl(params))
      .then((res) => {
        setTeachers((prev) => [...prev, ...res.teachers]);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      });
  }, [loading, loadingMore, teachers.length, total, buildParams]);

  /**
   * Auto lazy-load: observe sentinel vs the viewport (root: null).
   * The page scrolls on the window, not inside the inner <main>, so using a ref on main as root
   * was wrong unless that element actually scrolls — and mainScrollRef was never attached anyway.
   * Unobserve during fetch so a visible sentinel cannot spam requests.
   */
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || loading || teachers.length >= total || total === 0) {
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loadingMoreRef.current) return;
        io.unobserve(sentinel);
        loadMoreTeachers().finally(() => {
          if (sentinel.isConnected) {
            requestAnimationFrame(() => {
              try {
                io.observe(sentinel);
              } catch {
                /* observer disconnected */
              }
            });
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px 480px 0px',
        threshold: 0,
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [loading, teachers.length, total, loadMoreTeachers]);

  const subjectsList =
    boards.length && classes.length && masters?.subjects
      ? masters.subjects
      : masters?.mappings
        ? [...new Set(masters.mappings.flatMap((m) => m.subjects || []))].sort()
        : [];

  const clearFilters = () => setSearchParams({});
  const switchEnrollmentId = searchParams.get('switchEnrollmentId');

  const hasActiveFilters = useMemo(() => {
    return (
      boardParam !== '' ||
      classParam !== '' ||
      subjectParam !== '' ||
      dayParam !== '' ||
      timeParam !== '' ||
      search.trim() !== '' ||
      minFee > FEE_MIN ||
      maxFee < FEE_MAX ||
      batchStartFrom !== '' ||
      bgvVerified ||
      minExperience !== '' ||
      languageParam !== '' ||
      sort !== 'relevance'
    );
  }, [
    boardParam,
    classParam,
    subjectParam,
    dayParam,
    timeParam,
    search,
    minFee,
    maxFee,
    batchStartFrom,
    bgvVerified,
    minExperience,
    languageParam,
    sort,
  ]);

  if (error) {
    return (
      <InlineErrorDisplay
        error={error}
        onRetry={() => {
          setError(null);
          setRetryNonce((n) => n + 1);
        }}
        fullPage
      />
    );
  }

  const clearFiltersButton = hasActiveFilters ? (
    <button
      type="button"
      onClick={clearFilters}
      className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-gray-600 transition hover:bg-brand-100 hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      title="Clear filters"
      aria-label="Clear filters"
    >
      <span className="text-xs font-semibold uppercase tracking-wide">Clear</span>
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  ) : null;

  return (
    <div className="-mx-4 flex min-h-[calc(100vh)] flex-1 flex-col sm:-mx-6 lg:-mx-8 w-full min-w-0">      <div className="mx-auto flex w-full min-w-0 flex-1 flex-col px-4 sm:px-5 lg:px-6">
        <div className="flex min-h-0 flex-1 flex-col gap-0 lg:flex-row lg:gap-6 lg:items-start">
        <aside
          className={`sticky top-0 z-10 w-full shrink-0 self-start lg:w-auto ${filtersOpen ? 'block' : 'hidden lg:block'}`}
        >
          <div className="w-full min-w-0">
            <FilterSidebar
              spacious
              scrollBody
              cardClassName="lg:h-[calc(100vh - 8px)]"
              scrollBodyClassName="marketplace-filter-scroll"
              headerAction={clearFiltersButton}
              title="Filter & Sort"
              footer={
                <p className="text-sm font-medium text-gray-600">
                  {loading && !teachers.length ? '...' : `${total} teacher${total !== 1 ? 's' : ''}`}
                </p>
              }
            >
              <>
                <div>
                  <label htmlFor="marketplace-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Search
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      id="marketplace-search"
                      type="search"
                      placeholder="Teacher name..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-gray-200/90 bg-gray-50/90 py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="filter-sort" className="mb-1.5 block text-xs font-medium text-gray-600">
                    Sort by
                  </label>
                  <select
                    id="filter-sort"
                    value={sort}
                    onChange={(e) => updateParam('sort', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                </div>

                <MultiSelectFilter
                  label={t('board')}
                  options={masters?.boards || []}
                  selected={boards}
                  onChange={(v) => updateParam('board', v)}
                />
                <MultiSelectFilter
                  label={t('class')}
                  options={masters?.classes || []}
                  selected={classes}
                  onChange={(v) => updateParam('class', v)}
                />
                <MultiSelectFilter
                  label={t('subjects')}
                  options={subjectsList}
                  selected={subjects}
                  onChange={(v) => updateParam('subject', v)}
                />
                <MultiSelectFilter
                  label="Day"
                  options={DAYS}
                  selected={days}
                  onChange={(v) => updateParam('day', v)}
                />
                <MultiSelectFilter
                  label="Time"
                  options={TIME_SLOTS}
                  selected={times}
                  onChange={(v) => updateParam('time', v)}
                  placeholder="Any time"
                />

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Fee range</label>
                  <FeeRangeSlider
                    min={FEE_MIN}
                    max={FEE_MAX}
                    valueMin={minFee}
                    valueMax={maxFee}
                    onChange={(mn, mx) => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        if (mn > FEE_MIN) next.set('minFee', String(mn));
                        else next.delete('minFee');
                        if (mx < FEE_MAX) next.set('maxFee', String(mx));
                        else next.delete('maxFee');
                        next.delete('offset');
                        return next;
                      });
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="batch-start" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Batch starts from
                  </label>
                  <input
                    id="batch-start"
                    type="date"
                    value={batchStartFrom}
                    onChange={(e) => updateParam('batchStartFrom', e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200/90 bg-gray-50/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">BGV verified</span>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200/90 bg-gray-50/90 px-3.5 py-2.5 shadow-sm">
                    <input
                      type="checkbox"
                      checked={bgvVerified}
                      onChange={(e) => updateParam('bgvVerified', e.target.checked ? 'true' : '')}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-900">Verified only</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="filter-experience" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Experience
                  </label>
                  <select
                    id="filter-experience"
                    value={minExperience}
                    onChange={(e) => updateParam('minExperience', e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-gray-200/90 bg-gray-50/90 px-3.5 py-3 text-sm text-gray-900 shadow-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <MultiSelectFilter
                  label="Languages"
                  options={LANGUAGES}
                  selected={languages}
                  onChange={(v) => updateParam('languages', v)}
                  placeholder="Any language"
                />
              </>
            </FilterSidebar>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-w-0 flex-1">
            {switchEnrollmentId && (subjectParam || boardParam || classParam) && (
              <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 p-4 shadow-sm">
                <p className="font-medium text-amber-900">
                  You're switching teacher for {subjectParam || 'this course'}
                  {classParam && ` Class ${classParam}`}
                  {boardParam && ` (${boardParam})`}.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Select a new teacher below. If their fee is higher, you'll pay the difference. If lower, no refund applies.
                </p>
              </div>
            )}

            <div className="mb-3 flex items-center justify-start lg:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-900/5 transition hover:border-gray-300 hover:bg-gray-50"
              >
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </button>
            </div>

            <div className="pb-10">
            {loading && !teachers.length ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
                <p className="text-sm font-medium text-gray-500">Loading teachers...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-10 text-center shadow-sm ring-1 ring-gray-900/5 sm:p-14">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-gray-200/80">
                  👩‍🏫
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No teachers found</h3>
                <p className="mb-6 text-sm text-gray-600">Try adjusting filters or search — or broaden your criteria.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:gap-7 pt-3">
                  {teachers.map((teacher, idx) => (
                    <TeacherMarketplaceCard
                      key={teacher._id}
                      teacher={teacher}
                      index={idx}
                      switchEnrollmentId={switchEnrollmentId}
                      isInWishlist={isInWishlist(teacher._id)}
                      onWishlistToggle={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInWishlist(teacher._id)) {
                          await removeFromWishlist(teacher._id);
                        } else {
                          await addToWishlist(teacher._id);
                        }
                      }}
                    />
                  ))}
                </div>
                <div
                  ref={loadMoreSentinelRef}
                  className="flex min-h-[1px] flex-col items-center justify-center py-8"
                >
                  {loadingMore && (
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                  )}
                  {!loadingMore && teachers.length < total && teachers.length > 0 && (
                    <p className="text-sm text-gray-500">Scroll for more teachers…</p>
                  )}
                </div>
              </>
            )}
          </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
