import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { apiJson, API_BASE } from '@/lib/api';
import { ConsentModal } from '@/components/ConsentModal';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

function resolveMediaUrl(u: string): string {
  if (!u) return '';
  if (u.startsWith('data:') || u.startsWith('http://') || u.startsWith('https://')) return u;
  return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
}

function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) return `Image must be under ${MAX_IMAGE_MB}MB`;
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) return 'Please use JPG, PNG or WebP';
  return null;
}

function validateDataUrlSize(dataUrl: string): string | null {
  const i = dataUrl.indexOf(',');
  const base64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  const bytes = (base64.length * 3) / 4;
  if (bytes > MAX_IMAGE_BYTES) return `Image must be under ${MAX_IMAGE_MB}MB`;
  return null;
}

function ageFromDob(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export type AddStudentSuccessPayload = {
  studentId: string;
  password: string;
  name: string;
};

interface AddEditStudentFormProps {
  onSuccess: (payload: AddStudentSuccessPayload) => void;
  onCancel: () => void;
}

export default function AddEditStudentForm({ onSuccess, onCancel }: AddEditStudentFormProps) {
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    classLevel: '',
    board: '',
    schoolName: '',
    photoUrl: '',
    idProofUrl: '',
    consentDataCollection: false,
    consentAiMonitoring: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentModal, setConsentModal] = useState<'child_data_collection' | 'ai_monitoring' | null>(null);
  const [cameraFor, setCameraFor] = useState<'photo' | 'idProof' | null>(null);

  const [mastersLoading, setMastersLoading] = useState(true);
  const [masterBoards, setMasterBoards] = useState<string[]>([]);
  const [masterClasses, setMasterClasses] = useState<string[]>([]);
  const [boardClassMappings, setBoardClassMappings] = useState<{ board: string; classLevel: string }[]>([]);

  const photoUploadRef = useRef<HTMLInputElement>(null);
  const idUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setMastersLoading(true);
    apiJson<{
      boards?: string[];
      classes?: string[];
      mappings?: { board: string; classLevel: string }[];
    }>('/api/board-class-subjects')
      .then((d) => {
        if (cancelled) return;
        setMasterBoards(d.boards || []);
        setMasterClasses(d.classes || []);
        setBoardClassMappings((d.mappings || []) as { board: string; classLevel: string }[]);
      })
      .catch(() => {
        if (!cancelled) {
          setMasterBoards([]);
          setMasterClasses([]);
          setBoardClassMappings([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMastersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const classOptionsForBoard = useMemo(() => {
    if (!form.board || boardClassMappings.length === 0) return masterClasses;
    const allowed = new Set(
      boardClassMappings.filter((m) => m.board === form.board).map((m) => m.classLevel)
    );
    if (allowed.size === 0) return masterClasses;
    return masterClasses.filter((c) => allowed.has(c));
  }, [form.board, boardClassMappings, masterClasses]);

  const computedAge = useMemo(() => {
    if (!form.dateOfBirth) return null;
    const a = ageFromDob(form.dateOfBirth);
    if (Number.isNaN(a) || a < 0) return null;
    return a;
  }, [form.dateOfBirth]);

  const clearFieldError = useCallback((key: string) => {
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const handleImagePick = (field: 'photoUrl' | 'idProofUrl', file: File | undefined) => {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      setErrors((e) => ({ ...e, [field]: err }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, [field]: reader.result as string }));
      clearFieldError(field);
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = form.name.trim();
    if (name.length < 2) next.name = 'Enter at least 2 characters';
    else if (name.length > 120) next.name = 'Name is too long';
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required';
    else {
      const age = ageFromDob(form.dateOfBirth);
      const d = new Date(form.dateOfBirth);
      if (Number.isNaN(d.getTime())) next.dateOfBirth = 'Invalid date';
      else if (d > new Date()) next.dateOfBirth = 'Date cannot be in the future';
      else if (age < 4 || age > 25) next.dateOfBirth = 'Learner age should be between 4 and 25 years';
    }
    if (!form.classLevel.trim()) next.classLevel = 'Class / grade is required';
    else if (form.classLevel.trim().length > 50) next.classLevel = 'Too long';
    if (!form.board.trim()) next.board = 'Board is required';
    else if (form.board.trim().length > 80) next.board = 'Too long';
    if (form.schoolName.length > 200) next.schoolName = 'School name is too long';

    if (!form.photoUrl?.trim()) next.photoUrl = 'A clear student photo is required for AI identity checks';
    if (!form.idProofUrl?.trim()) next.idProofUrl = 'ID proof photo is required for verification';

    if (!form.consentDataCollection) next.consentDataCollection = 'Please accept child data collection';
    if (!form.consentAiMonitoring) next.consentAiMonitoring = 'Please accept AI monitoring terms';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiJson<{
        success: boolean;
        studentId: string;
        password: string;
        student: { name?: string };
      }>('/api/parent/students/create', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          dateOfBirth: form.dateOfBirth,
          classLevel: form.classLevel.trim(),
          board: form.board.trim(),
          schoolName: form.schoolName.trim() || undefined,
          photoUrl: form.photoUrl.trim(),
          idProofUrl: form.idProofUrl.trim(),
          consentDataCollection: true,
          consentAiMonitoring: true,
        }),
      });
      onSuccess({
        studentId: res.studentId,
        password: res.password,
        name: res.student?.name || form.name.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const photoPreview = form.photoUrl ? resolveMediaUrl(form.photoUrl) : '';
  const idPreview = form.idProofUrl ? resolveMediaUrl(form.idProofUrl) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border-2 border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-brand-50/40 p-4 shadow-sm">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-200/40 blur-2xl" />
        <div className="relative flex gap-3">
          <span className="text-2xl" aria-hidden>
            🤖
          </span>
          <div>
            <p className="text-sm font-bold text-violet-900">Verification & safety</p>
            <p className="mt-1 text-xs leading-relaxed text-violet-900/80">
              Your child&apos;s <strong>photo</strong> and <strong>ID proof</strong> are used by our AI and systems to confirm identity
              during classes and exams, detect mismatches, and keep sessions secure. Upload a clear face photo and a readable school ID /
              government ID card image. You can <strong>upload a file</strong> or <strong>take a picture</strong> where supported.
            </p>
          </div>
        </div>
      </div>

      {/* Student photo */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-900">
          <span className="text-lg" aria-hidden>
            📸
          </span>
          Student photo <span className="text-red-600">*</span>
        </label>
        <p className="mb-3 text-xs text-gray-600">Clear, front-facing photo — used for live class &amp; exam AI checks.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50">
            {photoPreview ? (
              <img src={photoPreview} alt="Student" className="h-full w-full object-cover" />
            ) : (
              <span className="p-4 text-center text-xs text-gray-500">No photo yet</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <input
              ref={photoUploadRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleImagePick('photoUrl', e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => photoUploadRef.current?.click()}
              className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
            >
              Upload photo
            </button>
            <button
              type="button"
              onClick={() => setCameraFor('photo')}
              className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
            >
              Take picture
            </button>
            {form.photoUrl && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, photoUrl: '' }));
                  clearFieldError('photoUrl');
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {errors.photoUrl && <p className="mt-2 text-sm font-medium text-red-600">{errors.photoUrl}</p>}
      </div>

      {/* ID proof */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-900">
          <span className="text-lg" aria-hidden>
            🪪
          </span>
          Student ID proof <span className="text-red-600">*</span>
        </label>
        <p className="mb-3 text-xs text-gray-600">School ID card, Bonafide, or government ID — text should be readable.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-36 w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 sm:h-36">
            {idPreview ? (
              <img src={idPreview} alt="ID proof" className="h-full w-full object-contain" />
            ) : (
              <span className="p-4 text-center text-xs text-gray-500">No document yet</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <input
              ref={idUploadRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleImagePick('idProofUrl', e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => idUploadRef.current?.click()}
              className="rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={() => setCameraFor('idProof')}
              className="rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-50"
            >
              Capture photo
            </button>
            {form.idProofUrl && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, idProofUrl: '' }));
                  clearFieldError('idProofUrl');
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {errors.idProofUrl && <p className="mt-2 text-sm font-medium text-red-600">{errors.idProofUrl}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="stu-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
            Full name *
          </label>
          <input
            id="stu-name"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              clearFieldError('name');
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 ${
              errors.name ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/25'
            }`}
            placeholder="As on school records"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
        </div>
        <div className="sm:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="min-w-0 flex-1">
              <label htmlFor="stu-dob" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
                Date of birth *
              </label>
              <input
                id="stu-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => {
                  setForm((f) => ({ ...f, dateOfBirth: e.target.value }));
                  clearFieldError('dateOfBirth');
                }}
                className={`w-full rounded-xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 ${
                  errors.dateOfBirth ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/25'
                }`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-xs font-medium text-red-600">{errors.dateOfBirth}</p>}
            </div>
            <div className="flex shrink-0 flex-col sm:w-36">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Age</span>
              <div
                className="flex min-h-[46px] items-center justify-center rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 px-4 py-2.5 text-center shadow-inner"
                aria-live="polite"
              >
                {computedAge != null ? (
                  <span className="text-lg font-extrabold tabular-nums text-brand-900">
                    {computedAge} <span className="text-sm font-bold text-brand-700">years</span>
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="stu-board" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
            Board *
          </label>
          <select
            id="stu-board"
            value={form.board}
            disabled={mastersLoading}
            onChange={(e) => {
              const board = e.target.value;
              setForm((f) => ({ ...f, board, classLevel: '' }));
              clearFieldError('board');
              clearFieldError('classLevel');
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
              errors.board ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/25'
            }`}
          >
            <option value="">{mastersLoading ? 'Loading boards…' : 'Select board'}</option>
            {masterBoards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {errors.board && <p className="mt-1 text-xs font-medium text-red-600">{errors.board}</p>}
        </div>
        <div>
          <label htmlFor="stu-class" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
            Class / grade *
          </label>
          <select
            id="stu-class"
            value={form.classLevel}
            disabled={mastersLoading || !form.board}
            onChange={(e) => {
              setForm((f) => ({ ...f, classLevel: e.target.value }));
              clearFieldError('classLevel');
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
              errors.classLevel ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/25'
            }`}
          >
            <option value="">
              {!form.board ? 'Select board first' : mastersLoading ? 'Loading…' : 'Select class'}
            </option>
            {classOptionsForBoard.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.classLevel && <p className="mt-1 text-xs font-medium text-red-600">{errors.classLevel}</p>}
        </div>
        {!mastersLoading && masterBoards.length === 0 && (
          <p className="sm:col-span-2 text-xs text-amber-800">
            Could not load board and class lists. Refresh the page or try again later.
          </p>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="stu-school" className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">
            School name (optional)
          </label>
          <input
            id="stu-school"
            value={form.schoolName}
            onChange={(e) => {
              setForm((f) => ({ ...f, schoolName: e.target.value }));
              clearFieldError('schoolName');
            }}
            className={`w-full rounded-xl border px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 ${
              errors.schoolName ? 'border-red-300 bg-red-50/50 focus:ring-red-200' : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/25'
            }`}
            placeholder="School name"
          />
          {errors.schoolName && <p className="mt-1 text-xs font-medium text-red-600">{errors.schoolName}</p>}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-bold text-amber-950">Parent consents</p>
        <p className="mb-4 text-xs text-amber-900/85">
          Open each document to read it in full, then tick to confirm. These are required to add a learner profile.
        </p>

        <div className="space-y-3">
          <div
            className={`rounded-xl border p-3 ${
              errors.consentDataCollection ? 'border-red-200 bg-red-50/50' : 'border-amber-200/70 bg-white/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setConsentModal('child_data_collection')}
              className="mb-2 text-left text-sm font-semibold text-brand-700 underline decoration-2 underline-offset-2 hover:text-brand-900"
            >
              Read: Child data collection →
            </button>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consentDataCollection}
                onChange={(e) => {
                  setForm((f) => ({ ...f, consentDataCollection: e.target.checked }));
                  clearFieldError('consentDataCollection');
                }}
                className="mt-1 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-800">I agree to the Child Data Collection terms above.</span>
            </label>
            {errors.consentDataCollection && (
              <p className="mt-2 text-xs font-medium text-red-600">{errors.consentDataCollection}</p>
            )}
          </div>

          <div
            className={`rounded-xl border p-3 ${
              errors.consentAiMonitoring ? 'border-red-200 bg-red-50/50' : 'border-amber-200/70 bg-white/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setConsentModal('ai_monitoring')}
              className="mb-2 text-left text-sm font-semibold text-brand-700 underline decoration-2 underline-offset-2 hover:text-brand-900"
            >
              Read: AI monitoring →
            </button>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consentAiMonitoring}
                onChange={(e) => {
                  setForm((f) => ({ ...f, consentAiMonitoring: e.target.checked }));
                  clearFieldError('consentAiMonitoring');
                }}
                className="mt-1 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-800">I agree to the AI Monitoring terms above.</span>
            </label>
            {errors.consentAiMonitoring && (
              <p className="mt-2 text-xs font-medium text-red-600">{errors.consentAiMonitoring}</p>
            )}
          </div>
        </div>
      </div>

      {submitError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{submitError}</p>}

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : (
            'Add learner'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {consentModal && (
        <ConsentModal type={consentModal} isOpen={!!consentModal} onClose={() => setConsentModal(null)} />
      )}

      {cameraFor && (
        <CameraCaptureModal
          isOpen
          onClose={() => setCameraFor(null)}
          facingMode={cameraFor === 'photo' ? 'user' : 'environment'}
          title={cameraFor === 'photo' ? 'Take student photo' : 'Capture ID proof'}
          onCapture={(dataUrl) => {
            const err = validateDataUrlSize(dataUrl);
            const field = cameraFor === 'photo' ? 'photoUrl' : 'idProofUrl';
            if (err) {
              setErrors((e) => ({ ...e, [field]: err }));
              return false;
            }
            setForm((f) => ({ ...f, [field]: dataUrl }));
            clearFieldError(field);
          }}
        />
      )}
    </form>
  );
}
