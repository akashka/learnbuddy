import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

type BgvApprovedBy = { email?: string } | null;

type BatchWithEnrollments = {
  name?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  feePerMonth?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
  minStudents?: number;
  maxStudents?: number;
  isActive?: boolean;
  startDate?: string | Date;
  enrollmentOpen?: boolean;
  enrollmentClosureType?: string;
  batchIndex?: number;
  enrolledCount?: number;
  students?: { _id?: string; name?: string; studentId?: string }[];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

function BatchFormModal({
  isOpen,
  onClose,
  batch: initialBatch,
  mappingOptions,
  saving,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchWithEnrollments | null;
  mappingOptions: { board: string; classLevel: string; subject: string; label: string }[];
  saving: boolean;
  onSave: (batch: {
    name: string;
    board: string;
    classLevel: string;
    subject: string;
    minStudents: number;
    maxStudents: number;
    feePerMonth: number;
    slots: { day: string; startTime: string; endTime: string }[];
    startDate?: string;
    isActive?: boolean;
  }) => Promise<void>;
}) {
  const { min: minDate, max: maxDate } = getBatchStartDateBounds();
  const [name, setName] = useState(initialBatch?.name ?? '');
  const [board, setBoard] = useState(initialBatch?.board ?? '');
  const [classLevel, setClassLevel] = useState(initialBatch?.classLevel ?? '');
  const [subject, setSubject] = useState(initialBatch?.subject ?? '');
  const [minStudents, setMinStudents] = useState(initialBatch?.minStudents ?? 1);
  const [maxStudents, setMaxStudents] = useState(initialBatch?.maxStudents ?? 3);
  const [feePerMonth, setFeePerMonth] = useState(initialBatch?.feePerMonth ?? 2000);
  const [startDate, setStartDate] = useState(
    initialBatch?.startDate
      ? (typeof initialBatch.startDate === 'string' ? initialBatch.startDate : new Date(initialBatch.startDate).toISOString().slice(0, 10))
      : minDate
  );
  const [isActive, setIsActive] = useState(initialBatch?.isActive ?? true);
  const [slots, setSlots] = useState<{ day: string; startTime: string; endTime: string }[]>(
    (initialBatch?.slots && initialBatch.slots.length > 0)
      ? initialBatch.slots
      : [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }]
  );
  const [slotDay, setSlotDay] = useState('Mon');
  const [slotStart, setSlotStart] = useState('10:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialBatch?.name ?? '');
    setBoard(initialBatch?.board ?? '');
    setClassLevel(initialBatch?.classLevel ?? '');
    setSubject(initialBatch?.subject ?? '');
    setMinStudents(initialBatch?.minStudents ?? 1);
    setMaxStudents(initialBatch?.maxStudents ?? 3);
    setFeePerMonth(initialBatch?.feePerMonth ?? 2000);
    setStartDate(
      initialBatch?.startDate
        ? (typeof initialBatch.startDate === 'string' ? initialBatch.startDate : new Date(initialBatch.startDate).toISOString().slice(0, 10))
        : minDate
    );
    setIsActive(initialBatch?.isActive ?? true);
    setSlots(
      (initialBatch?.slots && initialBatch.slots.length > 0)
        ? initialBatch.slots
        : [{ day: 'Mon', startTime: '10:00', endTime: '11:00' }]
    );
  }, [isOpen, initialBatch, minDate]);

  const addSlot = () => {
    const endTime = addMinutes(slotStart, slotDuration);
    if (slots.some((s) => s.day === slotDay)) {
      setSlots((prev) => prev.map((s) => (s.day === slotDay ? { ...s, startTime: slotStart, endTime } : s)));
    } else {
      setSlots((prev) => [...prev, { day: slotDay, startTime: slotStart, endTime }]);
    }
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Batch name is required');
      return;
    }
    if (!board || !classLevel || !subject) {
      setError('Board, class and subject are required');
      return;
    }
    if (minStudents < 1 || maxStudents > 3 || minStudents >= maxStudents) {
      setError('Min students must be 1–3 and less than max students');
      return;
    }
    if (!feePerMonth || feePerMonth <= 0) {
      setError('Fee per month must be greater than 0');
      return;
    }
    if (slots.length === 0) {
      setError('At least one schedule slot is required');
      return;
    }
    try {
      await onSave({
        name: name.trim(),
        board,
        classLevel,
        subject,
        minStudents,
        maxStudents,
        feePerMonth,
        slots,
        startDate,
        isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-accent-800">
          {initialBatch ? 'Edit Batch' : 'Add Batch'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {mappingOptions.length > 0 ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-accent-700">Board – Class – Subject</label>
                <select
                  value={mappingOptions.find((o) => o.board === board && o.classLevel === classLevel && o.subject === subject)?.label ?? ''}
                  onChange={(e) => {
                    const opt = mappingOptions.find((o) => o.label === e.target.value);
                    if (opt) {
                      setBoard(opt.board);
                      setClassLevel(opt.classLevel);
                      setSubject(opt.subject);
                    }
                  }}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                >
                  <option value="">Select mapping</option>
                  {mappingOptions.map((o) => (
                    <option key={o.label} value={o.label}>{o.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Board</label>
                  <input
                    type="text"
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    placeholder="e.g. CBSE"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Class</label>
                  <input
                    type="text"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Math"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Batch Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Batch"
                className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Fee per month (₹)</label>
              <input
                type="number"
                min={1}
                value={feePerMonth}
                onChange={(e) => setFeePerMonth(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={minDate}
                max={maxDate}
                className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-accent-700">Min / Max Students</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={2}
                  value={minStudents}
                  onChange={(e) => setMinStudents(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="batch-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-accent-300"
              />
              <label htmlFor="batch-active" className="text-sm font-medium text-accent-700">Active</label>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-accent-700">Schedule</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value)}
                className="rounded-lg border border-accent-200 px-2 py-1 text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="rounded-lg border border-accent-200 px-2 py-1 text-sm"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                className="rounded-lg border border-accent-200 px-2 py-1 text-sm"
              >
                {[30, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
              <button type="button" onClick={addSlot} className="rounded-lg bg-accent-100 px-3 py-1 text-sm text-accent-800 hover:bg-accent-200">
                Add slot
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {slots.map((s, i) => (
                <li key={i} className="flex items-center justify-between rounded bg-accent-50 px-2 py-1">
                  <span>{s.day} {s.startTime}–{s.endTime}</span>
                  <button type="button" onClick={() => removeSlot(i)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-accent-200 px-4 py-2 text-sm font-medium text-accent-700 hover:bg-accent-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function arrToStr(arr: unknown): string {
  return Array.isArray(arr) ? arr.map(String).filter(Boolean).join(', ') : '';
}

function strToArr(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [bgvLoading, setBgvLoading] = useState(false);
  const [bgvError, setBgvError] = useState<string | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalEdit, setBatchModalEdit] = useState<BatchWithEnrollments | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [masters, setMasters] = useState<{ boards: { value: string }[]; classes: { value: string }[]; subjects: { value: string }[]; mappings: { board: string; classLevel: string; subject: string }[] } | null>(null);

  const mappingOptions = useMemo(() => {
    const mappings = (masters?.mappings ?? []) as { board?: string; classLevel?: string; subjects?: string[] }[];
    let options = mappings.flatMap((m) =>
      (m.subjects ?? []).map((subject) => ({
        board: m.board ?? '',
        classLevel: m.classLevel ?? '',
        subject,
        label: `${m.board} | Class ${m.classLevel} | ${subject}`,
      }))
    );
    if (options.length === 0 && data) {
      const boards = (data.board ?? []) as string[];
      const classes = (data.classes ?? []) as string[];
      const subjects = (data.subjects ?? []) as string[];
      options = boards.flatMap((b) =>
        classes.flatMap((c) =>
          subjects.map((s) => ({
            board: b,
            classLevel: c,
            subject: s,
            label: `${b} | Class ${c} | ${s}`,
          }))
        )
      );
    }
    return options;
  }, [masters?.mappings, data]);

  useEffect(() => {
    adminApi.masters().then((m) => setMasters(m as typeof masters));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi.teachers.get(id)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshData = () => {
    if (!id) return;
    adminApi.teachers.get(id)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'));
  };

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    photoUrl: '',
    gender: '',
    dateOfBirth: '',
    qualification: '',
    profession: '',
    languages: '',
    experienceMonths: '',
    bio: '',
    demoVideoUrl: '',
    board: '',
    classes: '',
    subjects: '',
    status: '',
    marketplaceOrder: '',
    commissionPercent: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    setEditForm({
      name: String(d.name ?? ''),
      phone: String(d.phone ?? ''),
      photoUrl: String(d.photoUrl ?? ''),
      gender: String(d.gender ?? ''),
      dateOfBirth: d.dateOfBirth ? (typeof d.dateOfBirth === 'string' ? d.dateOfBirth : new Date(d.dateOfBirth as Date).toISOString().slice(0, 10)) : '',
      qualification: String(d.qualification ?? ''),
      profession: String(d.profession ?? ''),
      languages: arrToStr(d.languages),
      experienceMonths: d.experienceMonths != null ? String(d.experienceMonths) : '',
      bio: String(d.bio ?? ''),
      demoVideoUrl: String(d.demoVideoUrl ?? ''),
      board: arrToStr(d.board),
      classes: arrToStr(d.classes),
      subjects: arrToStr(d.subjects),
      status: String(d.status ?? ''),
      marketplaceOrder: d.marketplaceOrder != null ? String(d.marketplaceOrder) : '',
      commissionPercent: d.commissionPercent != null ? String(d.commissionPercent) : '10',
      accountNumber: String((d.bankDetails as { accountNumber?: string })?.accountNumber ?? ''),
      ifsc: String((d.bankDetails as { ifsc?: string })?.ifsc ?? ''),
      bankName: String((d.bankDetails as { bankName?: string })?.bankName ?? ''),
    });
  }, [data]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const exp = editForm.experienceMonths.trim();
      const payload: Record<string, unknown> = {
        name: editForm.name.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        photoUrl: editForm.photoUrl.trim() || undefined,
        gender: editForm.gender.trim() || undefined,
        dateOfBirth: editForm.dateOfBirth.trim() ? editForm.dateOfBirth : undefined,
        qualification: editForm.qualification.trim() || undefined,
        profession: editForm.profession.trim() || undefined,
        experienceMonths: exp ? (parseInt(exp, 10) || undefined) : undefined,
        bio: editForm.bio.trim() || undefined,
        demoVideoUrl: editForm.demoVideoUrl.trim() || undefined,
        status: editForm.status || undefined,
        commissionPercent: editForm.commissionPercent ? parseInt(editForm.commissionPercent, 10) : undefined,
        bankDetails: {
          accountNumber: editForm.accountNumber.trim() || undefined,
          ifsc: editForm.ifsc.trim() || undefined,
          bankName: editForm.bankName.trim() || undefined,
        },
      };
      const langArr = strToArr(editForm.languages);
      if (langArr.length) payload.languages = langArr;
      const boardArr = strToArr(editForm.board);
      if (boardArr.length) payload.board = boardArr;
      const classesArr = strToArr(editForm.classes);
      if (classesArr.length) payload.classes = classesArr;
      const subjectsArr = strToArr(editForm.subjects);
      if (subjectsArr.length) payload.subjects = subjectsArr;
      if (editForm.marketplaceOrder.trim()) {
        const n = parseInt(editForm.marketplaceOrder, 10);
        if (!isNaN(n) && n >= 1) payload.marketplaceOrder = n;
      }
      await adminApi.teachers.update(id, payload);
      refreshData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveBgv = async () => {
    if (!id) return;
    setBgvLoading(true);
    setBgvError(null);
    try {
      await adminApi.teachers.approveBgv(id);
      toast.success('BGV approved');
      refreshData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to approve BGV';
      setBgvError(msg);
      toast.error(msg);
    } finally {
      setBgvLoading(false);
    }
  };

  const handleSaveBatch = async (batchData: {
    name: string;
    board: string;
    classLevel: string;
    subject: string;
    minStudents: number;
    maxStudents: number;
    feePerMonth: number;
    slots: { day: string; startTime: string; endTime: string }[];
    startDate?: string;
    isActive?: boolean;
  }) => {
    if (!id) return;
    setBatchSaving(true);
    try {
      const editIndex = batchModalEdit !== null ? (batchModalEdit.batchIndex ?? -1) : -1;

      const newBatch = {
        name: batchData.name,
        board: batchData.board,
        classLevel: batchData.classLevel,
        subject: batchData.subject,
        minStudents: batchData.minStudents,
        maxStudents: batchData.maxStudents,
        feePerMonth: batchData.feePerMonth,
        slots: batchData.slots,
        startDate: batchData.startDate ? new Date(batchData.startDate) : undefined,
        isActive: batchData.isActive ?? true,
        enrollmentOpen: true,
        enrollmentClosureType: 'teacher_only' as const,
      };

      const rawBatches = ((data?.batches ?? data?.batchesWithEnrollments) ?? []) as Record<string, unknown>[];
      const batchesForApi = rawBatches.map((b) => {
        const base = { ...b };
        delete (base as Record<string, unknown>).batchIndex;
        delete (base as Record<string, unknown>).enrolledCount;
        delete (base as Record<string, unknown>).students;
        return base;
      });

      const updatedBatches =
        editIndex >= 0
          ? batchesForApi.map((b, i) => (i === editIndex ? newBatch : b))
          : [...batchesForApi, newBatch];

      await adminApi.teachers.update(id, { batches: updatedBatches });
      toast.success(batchModalEdit ? 'Batch updated' : 'Batch added');
      setBatchModalOpen(false);
      setBatchModalEdit(null);
      refreshData();
    } catch (err) {
      throw err;
    } finally {
      setBatchSaving(false);
    }
  };

  const openAddBatch = () => {
    setBatchModalEdit(null);
    setBatchModalOpen(true);
  };

  const openEditBatch = (batch: BatchWithEnrollments) => {
    setBatchModalEdit(batch);
    setBatchModalOpen(true);
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Teacher Detail</h1>
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                Edit Teacher
                {(data.bgvVerified as boolean) && (
                  <span className="inline-flex items-center text-blue-600" title="Background verification completed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </h2>
              <p className="mb-4 text-sm text-accent-600">Email: {(data.userId as { email?: string })?.email ?? '-'} (managed via User) · Rating: {data.averageRating != null ? String(data.averageRating) : '-'} ({String(data.reviewCount ?? 0)} reviews)</p>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Basic Info</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Photo URL</label>
                      <input type="text" value={editForm.photoUrl} onChange={(e) => setEditForm((f) => ({ ...f, photoUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Gender</label>
                      <select value={editForm.gender} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
                        <option value="">—</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Date of Birth</label>
                      <input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Qualification</label>
                      <input type="text" value={editForm.qualification} onChange={(e) => setEditForm((f) => ({ ...f, qualification: e.target.value }))} placeholder="B.Ed, M.Sc, etc." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Profession</label>
                      <input type="text" value={editForm.profession} onChange={(e) => setEditForm((f) => ({ ...f, profession: e.target.value }))} placeholder="Teacher, Engineer, etc." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Languages (comma-separated)</label>
                      <input type="text" value={editForm.languages} onChange={(e) => setEditForm((f) => ({ ...f, languages: e.target.value }))} placeholder="English, Hindi, Marathi" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Experience (months)</label>
                      <input type="number" min={0} value={editForm.experienceMonths} onChange={(e) => setEditForm((f) => ({ ...f, experienceMonths: e.target.value }))} placeholder="24" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-accent-700">Bio</label>
                      <textarea value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-accent-700">Demo Video URL</label>
                      <input type="text" value={editForm.demoVideoUrl} onChange={(e) => setEditForm((f) => ({ ...f, demoVideoUrl: e.target.value }))} placeholder="https://youtube.com/..." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Teaching</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Board (comma-separated)</label>
                      <input type="text" value={editForm.board} onChange={(e) => setEditForm((f) => ({ ...f, board: e.target.value }))} placeholder="CBSE, ICSE" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Classes (comma-separated)</label>
                      <input type="text" value={editForm.classes} onChange={(e) => setEditForm((f) => ({ ...f, classes: e.target.value }))} placeholder="8, 9, 10" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Subjects (comma-separated)</label>
                      <input type="text" value={editForm.subjects} onChange={(e) => setEditForm((f) => ({ ...f, subjects: e.target.value }))} placeholder="Math, Physics" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
                        <option value="">—</option>
                        <option value="pending">Pending</option>
                        <option value="qualified">Qualified</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Marketplace Order</label>
                      <input type="number" min={1} value={editForm.marketplaceOrder} onChange={(e) => setEditForm((f) => ({ ...f, marketplaceOrder: e.target.value }))} placeholder="1 = first" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Commission %</label>
                      <input type="number" min={0} max={100} value={editForm.commissionPercent} onChange={(e) => setEditForm((f) => ({ ...f, commissionPercent: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Bank Details</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Account Number</label>
                      <input type="text" value={editForm.accountNumber} onChange={(e) => setEditForm((f) => ({ ...f, accountNumber: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">IFSC</label>
                      <input type="text" value={editForm.ifsc} onChange={(e) => setEditForm((f) => ({ ...f, ifsc: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Bank Name</label>
                      <input type="text" value={editForm.bankName} onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
              {Array.isArray(data.signedAgreements) && (data.signedAgreements as { type: string; signedAt: string }[]).length > 0 && (
                <div className="mt-4 border-t border-accent-100 pt-4 text-sm text-accent-600">
                  <p><strong>Signed agreements:</strong> {(data.signedAgreements as { type: string; signedAt: string }[]).map((a) => `${a.type} (${new Date(a.signedAt).toLocaleDateString()})`).join(', ')}</p>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                Background Verification
                {(data.bgvVerified as boolean) && (
                  <span
                    className="inline-flex items-center text-blue-600"
                    title="Background verification completed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </h2>
              {(data.bgvVerified as boolean) ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Status:</strong> <span className="text-blue-600">Verified</span></p>
                  <p><strong>Approved by:</strong> {String((data.bgvApprovedBy as BgvApprovedBy)?.email ?? '-')}</p>
                  <p><strong>Approved at:</strong> {data.bgvApprovedAt ? new Date(String(data.bgvApprovedAt)).toLocaleString() : '-'}</p>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-gray-600">Background verification not yet approved.</p>
                  <button
                    type="button"
                    onClick={handleApproveBgv}
                    disabled={bgvLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bgvLoading ? 'Approving...' : 'Approve BGV'}
                  </button>
                  {bgvError && <p className="mt-2 text-sm text-red-600">{bgvError}</p>}
                </div>
              )}
            </div>
            <div id="batches" className="rounded-xl border border-accent-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Batches</h2>
                <button
                  type="button"
                  onClick={openAddBatch}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
                >
                  Add Batch
                </button>
              </div>
              {Array.isArray(data.batchesWithEnrollments) && (data.batchesWithEnrollments as unknown[]).length > 0 ? (
                <div className="space-y-4">
                  {(data.batchesWithEnrollments as BatchWithEnrollments[]).map((b, i) => (
                    <div key={i} className="rounded-lg border border-accent-100 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-medium">{b.name ?? 'Unnamed batch'}</p>
                          <p className="text-sm text-accent-600">
                            {b.subject} · {b.board} · Class {b.classLevel}
                            {b.feePerMonth != null && ` · ₹${b.feePerMonth}/month`}
                            {b.slots && b.slots.length > 0 && (
                              <> · {b.slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}</>
                            )}
                          </p>
                          <p className="text-sm text-accent-500">{(b.enrolledCount ?? 0)} enrolled</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditBatch({ ...b, batchIndex: i })}
                          className="rounded-lg border border-accent-200 px-3 py-1 text-sm font-medium text-accent-700 hover:bg-accent-50"
                        >
                          Edit
                        </button>
                      </div>
                      {Array.isArray(b.students) && b.students.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm">
                          {b.students.map((s) => (
                            <p key={s._id ?? s.studentId ?? Math.random()}>
                              {(s as { _id?: string })._id ? (
                                <Link to={`/students/${(s as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                                  {s.name ?? s.studentId ?? '-'}
                                </Link>
                              ) : (
                                s.name ?? s.studentId ?? '-'
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-accent-600">No batches yet. Click &quot;Add Batch&quot; to create one.</p>
              )}
            </div>
            <BatchFormModal
              isOpen={batchModalOpen}
              onClose={() => { setBatchModalOpen(false); setBatchModalEdit(null); }}
              batch={batchModalEdit}
              mappingOptions={mappingOptions}
              saving={batchSaving}
              onSave={handleSaveBatch}
            />
            {Array.isArray(data.reviews) && (data.reviews as unknown[]).length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold">Recent Reviews</h2>
                <div className="space-y-2">
                  {(data.reviews as { rating?: number; review?: string; parentName?: string; createdAt?: string }[]).slice(0, 5).map((r, i) => (
                    <div key={i} className="border-b border-accent-100 pb-2 last:border-0">
                      <p className="text-sm">{r.rating}★ - {r.review ?? '-'} (by {r.parentName})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
