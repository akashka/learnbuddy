import { useEffect, useState, useMemo } from 'react';
import { useAutoSelectSingleOption } from '@/hooks/useAutoSelectSingleOption';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { formatDate, formatCurrency } from '@shared/formatters';

type EnrollmentClosureType = 'teacher_only' | 'one_week_after_start' | 'max_students_reached';

interface Batch {
  _id?: string;
  name?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  feePerMonth?: number;
  minStudents?: number;
  maxStudents?: number;
  isActive?: boolean;
  startDate?: string;
  enrolledCount?: number;
  slots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
  enrollmentOpen?: boolean;
  enrollmentClosureType?: EnrollmentClosureType;
  isEnrollmentOpen?: boolean;
}

interface Combination {
  board: string;
  classLevel: string;
  subject: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];
const DURATIONS = [
  { label: '30 mins', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

/* ─── Modals for batch details ───────────────────────────────────────────── */
function ClassDetailsModal({
  isOpen,
  onClose,
  batch,
}: {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', h);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !batch) return null;

  const ModalContent = (
    <div className="relative z-[101] w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
              {getSubjectIcon(batch.subject)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Class Details</h2>
              <p className="text-sm text-white/90">{batch.name || 'Batch'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <div className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Board</span>
            <span className="mt-1 text-base font-medium text-gray-900">{batch.board || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Class</span>
            <span className="mt-1 text-base font-medium text-gray-900">{batch.classLevel || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Subject</span>
            <span className="mt-1 text-base font-medium text-gray-900">{batch.subject || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fee / month</span>
            <span className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(batch.feePerMonth ?? 0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Students</span>
            <span className="mt-1 text-base font-medium text-gray-900">{batch.minStudents ?? 1}–{batch.maxStudents ?? 3} per batch</span>
          </div>
          {batch.startDate && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Start Date</span>
              <span className="mt-1 text-base font-medium text-gray-900">{formatDate(batch.startDate)}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Enrollment closes</span>
            <span className="mt-1 text-base font-medium text-gray-900">
              {batch.enrollmentClosureType === 'one_week_after_start'
                ? '1 week after start (auto)'
                : batch.enrollmentClosureType === 'max_students_reached'
                  ? 'When max students enrolled (auto)'
                  : 'Teacher closes manually'}
            </span>
          </div>
        </div>
        {batch.slots && batch.slots.length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Schedule</span>
            <div className="mt-2 space-y-2">
              {batch.slots.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-violet-50 px-4 py-3 text-sm font-medium text-gray-800">
                  <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {s.day} {s.startTime}–{s.endTime}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-6 py-4">
        <button type="button" onClick={onClose} className="btn-primary w-full">Close</button>
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      {ModalContent}
    </div>,
    document.body
  );
}

function EnrolledStudentsModal({
  isOpen,
  onClose,
  batchIndex,
  batchName,
  enrolledCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  batchIndex: number;
  batchName: string;
  enrolledCount: number;
}) {
  const [students, setStudents] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', h);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || batchIndex < 0) return;
    setLoading(true);
    apiJson<{ students: { name: string }[] }>(`/api/teacher/batches/${batchIndex}/students`)
      .then((d) => setStudents(d.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [isOpen, batchIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-[101] w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">👥</div>
              <div>
                <h2 className="text-xl font-bold text-white">Enrolled Students</h2>
                <p className="text-sm text-white/90">{batchName} · {enrolledCount} enrolled</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No enrolled students yet.</p>
          ) : (
            <ul className="space-y-3">
              {students.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-50 to-violet-50 px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold">
                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="font-medium text-gray-900">{s.name || 'Student'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4">
          <Link to="/teacher/classes" className="btn-secondary w-full text-center" onClick={onClose}>
            View Classes
          </Link>
          <button type="button" onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
function EnrollmentToggleConfirmModal({
  isOpen,
  onClose,
  batchName,
  open,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
  open: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', h);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const action = open ? 'Open' : 'Close';
  const message = open
    ? `Parents will be able to enroll in "${batchName}" again.`
    : `Parents will no longer be able to enroll in "${batchName}".`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-[101] w-full max-w-md animate-scale-in overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        <div className={`px-6 py-5 ${open ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
              {open ? '🔓' : '🔒'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{action} enrollment</h2>
              <p className="text-sm text-white/90">{batchName}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-700">{message}</p>
          <p className="mt-2 text-sm text-gray-500">Are you sure you want to continue?</p>
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition ${
              open
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
            }`}
          >
            Yes, {action.toLowerCase()} enrollment
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2) % 24;
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

function getBatchStartDateBounds() {
  const today = new Date();
  const min = new Date(today);
  min.setDate(min.getDate() + 1);
  const max = new Date(today);
  max.setDate(max.getDate() + 30);
  return { min: min.toISOString().slice(0, 10), max: max.toISOString().slice(0, 10) };
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

const SUBJECT_ICONS: Record<string, string> = {
  Mathematics: '🔢',
  Science: '🔬',
  English: '📚',
  Hindi: '📖',
  Physics: '⚛️',
  Chemistry: '🧪',
  Biology: '🌿',
  default: '📦',
};

function getSubjectIcon(subject?: string): string {
  return subject ? (SUBJECT_ICONS[subject] ?? SUBJECT_ICONS.default) : SUBJECT_ICONS.default;
}

function EditBatchModal({
  isOpen,
  onClose,
  batch,
  batchIndex,
  onSave,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch;
  batchIndex: number;
  onSave: (idx: number, data: Partial<Batch>) => Promise<void>;
  loading: boolean;
}) {
  const { min: minDate, max: maxDate } = getBatchStartDateBounds();
  const [name, setName] = useState('');
  const [feePerMonth, setFeePerMonth] = useState(2000);
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(3);
  const [startDate, setStartDate] = useState(minDate);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon']);
  const [timeMode, setTimeMode] = useState<'same' | 'different'>('same');
  const [sameStartTime, setSameStartTime] = useState('10:00');
  const [sameDuration, setSameDuration] = useState(60);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, { startTime: string; duration: number }>>({ Mon: { startTime: '10:00', duration: 60 } });
  const [enrollmentClosureType, setEnrollmentClosureType] = useState<EnrollmentClosureType>('teacher_only');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timeMode === 'different') {
      setPerDayTimes((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const day of selectedDays) {
          if (!next[day]) {
            next[day] = { startTime: sameStartTime, duration: sameDuration };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [timeMode, selectedDays, sameStartTime, sameDuration]);

  useEffect(() => {
    if (isOpen && batch) {
      setName(batch.name || '');
      setFeePerMonth(batch.feePerMonth ?? 2000);
      setMinStudents(batch.minStudents ?? 1);
      setMaxStudents(batch.maxStudents ?? 3);
      const sd = batch.startDate ? new Date(batch.startDate) : null;
      setStartDate(sd && !isNaN(sd.getTime()) ? sd.toISOString().slice(0, 10) : minDate);
      const slotDays = batch.slots?.map((s) => s.day || 'Mon').filter(Boolean);
      setSelectedDays(slotDays?.length ? slotDays : ['Mon']);
      setEnrollmentClosureType((batch.enrollmentClosureType as EnrollmentClosureType) || 'teacher_only');
      const slots = batch.slots || [];
      if (slots.length > 0) {
        const first = slots[0];
        const firstStart = first.startTime || '10:00';
        const [sh, sm] = firstStart.split(':').map(Number);
        const [eh, em] = (first.endTime || '11:00').split(':').map(Number);
        const firstDuration = Math.max(30, (eh * 60 + em) - (sh * 60 + sm));
        const allSameTime = slots.every((s) => s.startTime === firstStart);
        if (allSameTime) {
          setTimeMode('same');
          setSameStartTime(firstStart);
          setSameDuration(firstDuration);
        } else {
          setTimeMode('different');
          const perDay: Record<string, { startTime: string; duration: number }> = {};
          slots.forEach((s) => {
            const [sth, stm] = (s.startTime || '10:00').split(':').map(Number);
            const [eth, etm] = (s.endTime || '11:00').split(':').map(Number);
            perDay[s.day || 'Mon'] = {
              startTime: s.startTime || '10:00',
              duration: Math.max(30, (eth * 60 + etm) - (sth * 60 + stm)),
            };
          });
          setPerDayTimes(perDay);
        }
      }
      setError(null);
    }
  }, [isOpen, batch, minDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }
    const slots =
      timeMode === 'same'
        ? selectedDays.map((day) => ({
            day,
            startTime: sameStartTime,
            endTime: addMinutes(sameStartTime, sameDuration),
          }))
        : selectedDays.map((day) => {
            const p = perDayTimes[day] || { startTime: '10:00', duration: 60 };
            return {
              day,
              startTime: p.startTime,
              endTime: addMinutes(p.startTime, p.duration),
            };
          });
    const payload: Partial<Batch> = {
      name: name.trim(),
      board: batch.board,
      classLevel: batch.classLevel,
      subject: batch.subject,
      feePerMonth,
      minStudents,
      maxStudents,
      slots,
      startDate,
      enrollmentClosureType,
    };
    try {
      await onSave(batchIndex, payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', h);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-[101] w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Batch</h2>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Batch Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
            <div className="grid grid-cols-3 gap-4 rounded-xl bg-gray-50 px-4 py-3">
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-500">Board</label>
                <p className="text-sm font-semibold text-gray-900">{batch.board || '—'}</p>
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-500">Class</label>
                <p className="text-sm font-semibold text-gray-900">{batch.classLevel || '—'}</p>
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-gray-500">Subject</label>
                <p className="text-sm font-semibold text-gray-900">{batch.subject || '—'}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Board, class, and subject cannot be changed.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fee/month (₹)</label>
                <input type="number" min={1} value={feePerMonth} onChange={(e) => setFeePerMonth(parseInt(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={minDate} max={maxDate} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Min Students</label>
                <input type="number" min={1} max={3} value={minStudents} onChange={(e) => setMinStudents(parseInt(e.target.value) || 1)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Max Students</label>
                <input type="number" min={1} max={3} value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 1)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Enrollment closes when</label>
              <select value={enrollmentClosureType} onChange={(e) => setEnrollmentClosureType(e.target.value as EnrollmentClosureType)} className={inputClass}>
                <option value="teacher_only">Teacher closes manually anytime</option>
                <option value="one_week_after_start">1 week after start date (auto)</option>
                <option value="max_students_reached">Maximum students enrolled (auto)</option>
              </select>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Schedule</label>
              <div className="mb-3">
                <span className="mr-2 text-xs font-medium text-gray-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDays(WEEKDAYS);
                    setTimeMode('same');
                    setSameStartTime('10:00');
                    setSameDuration(60);
                  }}
                  className="mr-2 rounded-lg bg-brand-100 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-200"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDays(WEEKEND);
                    setTimeMode('same');
                    setSameStartTime('10:00');
                    setSameDuration(60);
                  }}
                  className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-200"
                >
                  Weekend
                </button>
              </div>
              <div className="mb-3">
                <span className="mb-2 block text-xs font-medium text-gray-600">Select days</span>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <label
                      key={d}
                      className={`flex cursor-pointer items-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                        selectedDays.includes(d) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input type="checkbox" checked={selectedDays.includes(d)} onChange={() => setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))} className="sr-only" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <span className="mb-2 block text-xs font-medium text-gray-600">Time mode</span>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="edit-timeMode" checked={timeMode === 'same'} onChange={() => setTimeMode('same')} />
                    Same time for all days
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="edit-timeMode" checked={timeMode === 'different'} onChange={() => setTimeMode('different')} />
                    Different time per day
                  </label>
                </div>
              </div>
              {timeMode === 'same' && (
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Time from</label>
                    <select value={sameStartTime} onChange={(e) => setSameStartTime(e.target.value)} className={inputClass}>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Duration</label>
                    <select value={sameDuration} onChange={(e) => setSameDuration(Number(e.target.value))} className={inputClass}>
                      {DURATIONS.map((d) => (
                        <option key={d.minutes} value={d.minutes}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {timeMode === 'different' && selectedDays.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedDays.map((day) => (
                    <div key={day} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
                      <span className="w-12 font-medium text-sm">{day}</span>
                      <select
                        value={perDayTimes[day]?.startTime || '10:00'}
                        onChange={(e) =>
                          setPerDayTimes((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], startTime: e.target.value, duration: prev[day]?.duration || 60 },
                          }))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-500">to</span>
                      <select
                        value={perDayTimes[day]?.duration || 60}
                        onChange={(e) =>
                          setPerDayTimes((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], startTime: prev[day]?.startTime || '10:00', duration: Number(e.target.value) },
                          }))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d.minutes} value={d.minutes}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || selectedDays.length === 0} className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function CreateBatchModal({
  isOpen,
  onClose,
  combinations,
  onCreate,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  combinations: Combination[];
  onCreate: (data: {
    name: string;
    board: string;
    classLevel: string;
    subject: string;
    minStudents: number;
    maxStudents: number;
    feePerMonth: number;
    slots: { day: string; startTime: string; endTime: string }[];
    startDate: string;
    enrollmentClosureType?: EnrollmentClosureType;
  }) => Promise<void>;
  loading: boolean;
}) {
  const { min: minDate, max: maxDate } = getBatchStartDateBounds();
  const [name, setName] = useState('');
  const [combo, setCombo] = useState('');
  const [feePerMonth, setFeePerMonth] = useState(2000);
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(3);
  const [startDate, setStartDate] = useState(minDate);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon']);
  const [timeMode, setTimeMode] = useState<'same' | 'different'>('same');
  const [sameStartTime, setSameStartTime] = useState('10:00');
  const [sameDuration, setSameDuration] = useState(60);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, { startTime: string; duration: number }>>({ Mon: { startTime: '10:00', duration: 60 } });
  const [enrollmentClosureType, setEnrollmentClosureType] = useState<EnrollmentClosureType>('teacher_only');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timeMode === 'different') {
      setPerDayTimes((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const day of selectedDays) {
          if (!next[day]) {
            next[day] = { startTime: sameStartTime, duration: sameDuration };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [timeMode, selectedDays, sameStartTime, sameDuration]);

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setCombo(combinations[0] ? `${combinations[0].board}|${combinations[0].classLevel}|${combinations[0].subject}` : '');
    setFeePerMonth(2000);
    setMinStudents(1);
    setMaxStudents(3);
    setStartDate(minDate);
    setSelectedDays(['Mon']);
    setTimeMode('same');
    setSameStartTime('10:00');
    setSameDuration(60);
    setPerDayTimes({ Mon: { startTime: '10:00', duration: 60 } });
    setEnrollmentClosureType('teacher_only');
    setError(null);
  }, [isOpen, combinations, minDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const [board, classLevel, subject] = combo.split('|');
    if (!name.trim() || !board || !classLevel || !subject) {
      setError('Please fill all required fields');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }
    const slots =
      timeMode === 'same'
        ? selectedDays.map((day) => ({
            day,
            startTime: sameStartTime,
            endTime: addMinutes(sameStartTime, sameDuration),
          }))
        : selectedDays.map((day) => {
            const p = perDayTimes[day] || { startTime: '10:00', duration: 60 };
            return {
              day,
              startTime: p.startTime,
              endTime: addMinutes(p.startTime, p.duration),
            };
          });
    try {
      await onCreate({ name: name.trim(), board, classLevel, subject, minStudents, maxStudents, feePerMonth, slots, startDate, enrollmentClosureType });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', h);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (combinations.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-10 max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <p className="text-sm text-gray-600">Complete your teaching profile (board, class, subjects) before creating batches.</p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Close
            </button>
            <Link to="/teacher/profile" className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700">
              Go to Profile
            </Link>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20';
  const comboOptions = combinations.map((c) => ({
    value: `${c.board}|${c.classLevel}|${c.subject}`,
    label: `${c.board} • Class ${c.classLevel} • ${c.subject}`,
  }));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-[101] w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create New Batch</h2>
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {comboOptions.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Board · Class · Subject</label>
                  <select value={combo} onChange={(e) => setCombo(e.target.value)} className={inputClass} required>
                    {comboOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Batch Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Batch" className={inputClass} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Enrollment closes when</label>
                <select value={enrollmentClosureType} onChange={(e) => setEnrollmentClosureType(e.target.value as EnrollmentClosureType)} className={inputClass}>
                  <option value="teacher_only">Teacher closes manually anytime</option>
                  <option value="one_week_after_start">1 week after start date (auto)</option>
                  <option value="max_students_reached">Maximum students enrolled (auto)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Fee/month (₹)</label>
                <input type="number" min={1} value={feePerMonth} onChange={(e) => setFeePerMonth(parseInt(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={minDate} max={maxDate} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Min Students</label>
                <input type="number" min={1} max={3} value={minStudents} onChange={(e) => setMinStudents(parseInt(e.target.value) || 1)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Max Students</label>
                <input type="number" min={1} max={3} value={maxStudents} onChange={(e) => setMaxStudents(parseInt(e.target.value) || 1)} className={inputClass} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Schedule</label>
              <div className="mb-3">
                <span className="mr-2 text-xs font-medium text-gray-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDays(WEEKDAYS);
                    setTimeMode('same');
                    setSameStartTime('10:00');
                    setSameDuration(60);
                  }}
                  className="mr-2 rounded-lg bg-brand-100 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-200"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDays(WEEKEND);
                    setTimeMode('same');
                    setSameStartTime('10:00');
                    setSameDuration(60);
                  }}
                  className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm text-brand-800 hover:bg-brand-200"
                >
                  Weekend
                </button>
              </div>
              <div className="mb-3">
                <span className="mb-2 block text-xs font-medium text-gray-600">Select days</span>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <label
                      key={d}
                      className={`flex cursor-pointer items-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                        selectedDays.includes(d) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input type="checkbox" checked={selectedDays.includes(d)} onChange={() => setSelectedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))} className="sr-only" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <span className="mb-2 block text-xs font-medium text-gray-600">Time mode</span>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="create-timeMode" checked={timeMode === 'same'} onChange={() => setTimeMode('same')} />
                    Same time for all days
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name="create-timeMode" checked={timeMode === 'different'} onChange={() => setTimeMode('different')} />
                    Different time per day
                  </label>
                </div>
              </div>
              {timeMode === 'same' && (
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Time from</label>
                    <select value={sameStartTime} onChange={(e) => setSameStartTime(e.target.value)} className={inputClass}>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Duration</label>
                    <select value={sameDuration} onChange={(e) => setSameDuration(Number(e.target.value))} className={inputClass}>
                      {DURATIONS.map((d) => (
                        <option key={d.minutes} value={d.minutes}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {timeMode === 'different' && selectedDays.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedDays.map((day) => (
                    <div key={day} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2">
                      <span className="w-12 font-medium text-sm">{day}</span>
                      <select
                        value={perDayTimes[day]?.startTime || '10:00'}
                        onChange={(e) =>
                          setPerDayTimes((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], startTime: e.target.value, duration: prev[day]?.duration || 60 },
                          }))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-500">to</span>
                      <select
                        value={perDayTimes[day]?.duration || 60}
                        onChange={(e) =>
                          setPerDayTimes((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], startTime: prev[day]?.startTime || '10:00', duration: Number(e.target.value) },
                          }))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d.minutes} value={d.minutes}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || comboOptions.length === 0 || selectedDays.length === 0} className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function TeacherBatches() {
  const [data, setData] = useState<{ batches: Batch[]; combinations: Combination[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editBatch, setEditBatch] = useState<{ batch: Batch; index: number } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterBoard, setFilterBoard] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterEnrollmentOpen, setFilterEnrollmentOpen] = useState<'all' | 'open' | 'closed'>('all');
  const [classDetailsBatch, setClassDetailsBatch] = useState<Batch | null>(null);
  const [enrolledBatch, setEnrolledBatch] = useState<{ index: number; name: string; count: number } | null>(null);
  const [enrollmentToggleModal, setEnrollmentToggleModal] = useState<{ index: number; batchName: string; open: boolean } | null>(null);

  const fetchBatches = () => {
    setError(null);
    setLoading(true);
    apiJson<{ batches: Batch[]; combinations: Combination[] }>('/api/teacher/batches')
      .then((d) => setData({ batches: d.batches || [], combinations: d.combinations || [] }))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchBatches(), []);

  const handleCreate = async (batchData: Parameters<NonNullable<Parameters<typeof CreateBatchModal>[0]['onCreate']>>[0]) => {
    setCreateLoading(true);
    try {
      await apiJson('/api/teacher/batches', {
        method: 'POST',
        body: JSON.stringify({
          ...batchData,
          slots: batchData.slots,
        }),
      });
      await fetchBatches();
      setCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleEnrollment = async (idx: number, open: boolean) => {
    try {
      await apiJson(`/api/teacher/batches/${idx}`, {
        method: 'PATCH',
        body: JSON.stringify({ enrollmentOpen: open }),
      });
      await fetchBatches();
      setEnrollmentToggleModal(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update enrollment');
    }
  };

  const handleUpdate = async (idx: number, updates: Partial<Batch>) => {
    setEditLoading(true);
    try {
      await apiJson(`/api/teacher/batches/${idx}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await fetchBatches();
      setEditBatch(null);
    } finally {
      setEditLoading(false);
    }
  };

  const batches = data?.batches || [];
  const combinations = data?.combinations || [];

  const filterOptions = useMemo(() => {
    const subjects = [...new Set(batches.map((b) => b.subject).filter(Boolean))].sort() as string[];
    const boards = [...new Set(batches.map((b) => b.board).filter(Boolean))].sort() as string[];
    return { subjects, boards };
  }, [batches]);

  useAutoSelectSingleOption(filterSubject, setFilterSubject, filterOptions.subjects, (v) => v === 'all');
  useAutoSelectSingleOption(filterBoard, setFilterBoard, filterOptions.boards, (v) => v === 'all');

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (filterSubject !== 'all' && b.subject !== filterSubject) return false;
      if (filterBoard !== 'all' && b.board !== filterBoard) return false;
      if (filterStatus === 'active' && !b.isActive) return false;
      if (filterStatus === 'inactive' && b.isActive) return false;
      if (filterEnrollmentOpen === 'open' && !b.isEnrollmentOpen) return false;
      if (filterEnrollmentOpen === 'closed' && b.isEnrollmentOpen) return false;
      return true;
    });
  }, [batches, filterSubject, filterBoard, filterStatus, filterEnrollmentOpen]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading batches...</p>
      </div>
    );
  }

  if (error && !data) return <InlineErrorDisplay error={error} onRetry={fetchBatches} fullPage />;

  return (
    <div className="w-full animate-fade-in">
      {/* Header Card */}
      <div className="mb-6 overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-lg">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-lg backdrop-blur-sm animate-bounce-subtle">
                📦
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">My Batches</h1>
                <p className="mt-1 text-sm text-white/90">
                  {batches.length} batch{batches.length !== 1 ? 'es' : ''} · {batches.filter((b) => b.isActive !== false).length} active
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-600 shadow-lg transition hover:bg-white/95 hover:shadow-xl"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Batch
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-violet-100 text-3xl">📦</div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">No batches yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">Create your first batch to start teaching and accepting students.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Batch
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters Sidebar - Left (wider) */}
          <aside className="shrink-0 lg:w-72">
            <div className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-white via-brand-50/20 to-accent-50 p-6 shadow-lg backdrop-blur-sm">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
              <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
                <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </h3>
              <div className="space-y-5">
                <div>
                  <label htmlFor="filter-subject" className="mb-1.5 block text-xs font-medium text-gray-600">Subject</label>
                  <select
                    id="filter-subject"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">All subjects</option>
                    {filterOptions.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-board" className="mb-1.5 block text-xs font-medium text-gray-600">Board</label>
                  <select
                    id="filter-board"
                    value={filterBoard}
                    onChange={(e) => setFilterBoard(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">All boards</option>
                    {filterOptions.boards.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-status" className="mb-1.5 block text-xs font-medium text-gray-600">Status</label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-enrollment" className="mb-1.5 block text-xs font-medium text-gray-600">Enrollment</label>
                  <select
                    id="filter-enrollment"
                    value={filterEnrollmentOpen}
                    onChange={(e) => setFilterEnrollmentOpen(e.target.value as typeof filterEnrollmentOpen)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">All</option>
                    <option value="open">Open for enrollment</option>
                    <option value="closed">Enrollment closed</option>
                  </select>
                </div>
              </div>
              <p className="mt-5 border-t border-gray-100 pt-4 text-sm font-medium text-gray-600">
                {filteredBatches.length} of {batches.length} batches
              </p>
            </div>
          </aside>

          {/* Batches List - Right */}
          <main className="min-w-0 flex-1">
            {filteredBatches.length === 0 ? (
              <div className="rounded-2xl border-2 border-brand-100 bg-white p-12 text-center shadow-sm">
                <p className="text-sm font-medium text-gray-500">No batches match your filters</p>
                <p className="mt-1 text-sm text-gray-400">Try adjusting the filter criteria</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredBatches.map((b, displayIdx) => {
                  const idx = batches.indexOf(b);
                  const canEdit = (b.enrolledCount ?? 0) === 0;
                  const isActive = b.isActive !== false;
                  const enrollmentOpen = b.isEnrollmentOpen ?? true;
                  const startDateStr = b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
                  return (
                    <div
                      key={b._id ?? idx}
                      className={`card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 shadow-lg transition-all duration-300 ${
                        isActive
                          ? 'border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 hover:border-brand-300 hover:shadow-xl'
                          : 'border-gray-200 bg-gray-50/70'
                      }`}
                      style={{ animationDelay: `${displayIdx * 0.05}s` }}
                    >
                      {/* Decorative corner splashes */}
                      {isActive && (
                        <>
                          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent-200/40 blur-2xl" />
                          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-200/35 blur-xl" />
                          <div className="absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border-2 border-dashed border-brand-300/40 animate-rotate-slow pointer-events-none" />
                          <div className="absolute -right-4 top-8 h-16 w-16 rounded-full border border-brand-200/50 pointer-events-none" style={{ animation: 'rotate-slow 15s linear infinite reverse' }} />
                        </>
                      )}
                      <div className="relative flex flex-col gap-4 p-6">
                        {/* Row 1: Details in one line */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-md ${
                            isActive ? 'bg-gradient-to-br from-brand-100 via-violet-100 to-brand-200' : 'bg-gray-200'
                          }`}>
                            {getSubjectIcon(b.subject)}
                          </div>
                          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            <h3 className="text-lg font-bold text-gray-900">{b.name || 'Batch'}</h3>
                            {!isActive && (
                              <span className="rounded-lg bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Inactive</span>
                            )}
                            {enrollmentOpen && isActive && (
                              <span className="rounded-lg bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Enrollment open</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">{b.board} · Class {b.classLevel} · {b.subject}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(b.feePerMonth ?? 0)}/mo</span>
                          <span className={`text-sm ${b.enrolledCount ? 'font-medium text-green-600' : 'text-gray-500'}`}>
                            {b.enrolledCount ?? 0} / {b.maxStudents ?? 3} enrolled
                          </span>
                          {startDateStr && (
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <svg className="h-4 w-4 shrink-0 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Starts {startDateStr}
                            </span>
                          )}
                        </div>

                        {/* Row 2: Action buttons in one line */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/80 pt-4">
                          <button
                            type="button"
                            onClick={() => setClassDetailsBatch(b)}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => setEnrolledBatch({ index: idx, name: b.name || 'Batch', count: b.enrolledCount ?? 0 })}
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Enrolled
                          </button>
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setEnrollmentToggleModal({ index: idx, batchName: b.name || 'Batch', open: !enrollmentOpen })}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all ${
                                enrollmentOpen
                                  ? 'border-2 border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100'
                                  : 'border-2 border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100'
                              }`}
                            >
                              {enrollmentOpen ? 'Close enrollment' : 'Open enrollment'}
                            </button>
                          )}
                          <Link
                            to="/teacher/classes"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-lg"
                          >
                            View Classes
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                          {canEdit && isActive && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditBatch({ batch: b, index: idx })}
                                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      <CreateBatchModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        combinations={combinations}
        onCreate={handleCreate}
        loading={createLoading}
      />

      {editBatch && (
        <EditBatchModal
          key={`edit-${editBatch.index}-${editBatch.batch.name}`}
          isOpen={!!editBatch}
          onClose={() => setEditBatch(null)}
          batch={editBatch.batch}
          batchIndex={editBatch.index}
          onSave={handleUpdate}
          loading={editLoading}
        />
      )}

      <ClassDetailsModal
        isOpen={!!classDetailsBatch}
        onClose={() => setClassDetailsBatch(null)}
        batch={classDetailsBatch}
      />

      <EnrolledStudentsModal
        isOpen={!!enrolledBatch}
        onClose={() => setEnrolledBatch(null)}
        batchIndex={enrolledBatch?.index ?? -1}
        batchName={enrolledBatch?.name ?? ''}
        enrolledCount={enrolledBatch?.count ?? 0}
      />

      {enrollmentToggleModal && (
        <EnrollmentToggleConfirmModal
          isOpen={!!enrollmentToggleModal}
          onClose={() => setEnrollmentToggleModal(null)}
          batchName={enrollmentToggleModal.batchName}
          open={enrollmentToggleModal.open}
          onConfirm={() => handleToggleEnrollment(enrollmentToggleModal.index, enrollmentToggleModal.open)}
        />
      )}
    </div>
  );
}
