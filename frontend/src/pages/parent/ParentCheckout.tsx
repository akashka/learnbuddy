import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiJson, ApiError, API_BASE, resolveMediaUrl } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { CmsContentModal } from '@/components/CmsContentModal';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { StudentCredentialsModal } from '@/components/StudentCredentialsModal';
import AddEditStudentForm, { type AddStudentSuccessPayload } from '@/pages/parent/AddEditStudentForm';
import { formatCurrency, formatDate } from '@shared/formatters';

interface Batch {
  name?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  feePerMonth?: number;
  slots?: { day?: string; startTime?: string; endTime?: string }[];
  maxStudents?: number;
  enrolledCount?: number;
  hideFromParents?: boolean;
}

interface Teacher {
  _id: string;
  name?: string;
  photoUrl?: string;
  batches?: Batch[];
}

interface ChildRow {
  _id: string;
  name?: string;
  classLevel?: string;
  board?: string;
  studentId?: string;
  photoUrl?: string;
  schoolName?: string;
}

type RenewalPreview = {
  renewalEnrollmentId: string;
  teacherId: string;
  batchIndex: number;
  duration: string;
  months: number;
  discountPercent: number;
  feePerMonth: number;
  baseAfterDuration: number;
  subject?: string;
  board?: string;
  classLevel?: string;
  batchId?: string;
  currentPeriodEnd?: string;
  extendedPeriodEnd?: string | null;
  studentId: string;
  teacher: Teacher;
  slots?: { day?: string; startTime?: string; endTime?: string }[];
};

type TeacherSwitchPreview = {
  studentId?: string;
  studentName?: string;
  oldTeacherName?: string;
  newTeacherName?: string;
  prorataBreakdown: {
    daysInMonth: number;
    switchDay: number;
    remainingDays: number;
    elapsedDays: number;
    oldFeeMonthly: number;
    newFeeMonthly: number;
    oldTeacherEarnedThisMonth: number;
    creditFromOldUnusedMonth: number;
    basePackageAfterDurationDiscount: number;
    subtotalAfterCredit: number;
  };
};

function normStr(s?: string | null): string {
  return (s || '').trim().toLowerCase();
}

function childAvatarUrl(photoUrl?: string): string | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) return photoUrl;
  return `${API_BASE}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

const DURATIONS = [
  {
    value: '3months',
    label: '3 months',
    shortLabel: '3 mo',
    months: 3,
    discount: 0,
    badge: 'Default',
    emoji: '📅',
  },
  {
    value: '6months',
    label: '6 months',
    shortLabel: '6 mo',
    months: 6,
    discount: 5,
    badge: 'Save 5%',
    emoji: '✨',
  },
  {
    value: '12months',
    label: '12 months',
    shortLabel: '12 mo',
    months: 12,
    discount: 10,
    badge: 'Best value · 10% off',
    emoji: '🎓',
  },
] as const;

export default function ParentCheckout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const teacherId = searchParams.get('teacherId');
  const batchIndex = parseInt(searchParams.get('batchIndex') || '0', 10);
  const durationParam = searchParams.get('duration') || '3months';
  const switchEnrollmentId = searchParams.get('switchEnrollmentId');
  const renewalEnrollmentId = searchParams.get('renewalEnrollmentId');

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformTerms, setPlatformTerms] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState(false);
  const [courseOwnership, setCourseOwnership] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<{ code: string; discountAmount: number; finalAmount: number } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [termsModal, setTermsModal] = useState<'platform' | 'refund' | 'course' | null>(null);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [addKidDrawerOpen, setAddKidDrawerOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<AddStudentSuccessPayload | null>(null);
  const [mismatchModalOpen, setMismatchModalOpen] = useState(false);

  const [switchPreview, setSwitchPreview] = useState<TeacherSwitchPreview | null>(null);
  const [switchPreviewError, setSwitchPreviewError] = useState<string | null>(null);
  const [switchPreviewLoading, setSwitchPreviewLoading] = useState(false);

  const [renewalPreview, setRenewalPreview] = useState<RenewalPreview | null>(null);

  const setDuration = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('duration', value);
        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (renewalEnrollmentId) {
      let cancelled = false;
      setError(null);
      setLoading(true);
      apiJson<RenewalPreview>(
        `/api/parent/renewal-checkout-preview?enrollmentId=${encodeURIComponent(renewalEnrollmentId)}`
      )
        .then((d) => {
          if (cancelled) return;
          setRenewalPreview(d);
          setTeacher(d.teacher);
          setSelectedStudentId(d.studentId);
          setPlatformTerms(true);
          setRefundPolicy(true);
          setCourseOwnership(true);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load renewal');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (!teacherId) {
      setError('Missing teacher. Go to Marketplace to select a teacher.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    Promise.all([
      apiJson<Teacher>(`/api/teachers/${teacherId}`),
      apiJson<{ children: ChildRow[] }>('/api/parent/students').catch(() => ({ children: [] as ChildRow[] })),
    ])
      .then(([t, s]) => {
        if (cancelled) return;
        setTeacher(t);
        const list = s.children || [];
        setChildren(list);
        if (list.length === 0) {
          setSelectedStudentId('');
        } else {
          setSelectedStudentId(String(list[0]._id));
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teacherId, renewalEnrollmentId]);

  const isRenewalFlow = !!renewalEnrollmentId;
  const duration =
    isRenewalFlow && renewalPreview?.duration
      ? renewalPreview.duration
      : DURATIONS.some((d) => d.value === durationParam)
        ? durationParam
        : '3months';
  const isSwitchFlow = !!switchEnrollmentId && !isRenewalFlow;
  const durationMeta = DURATIONS.find((d) => d.value === duration) || DURATIONS[0];

  const effectiveBatchIndex =
    isRenewalFlow && renewalPreview != null ? renewalPreview.batchIndex : batchIndex;

  useEffect(() => {
    if (renewalEnrollmentId) return;
    if (!DURATIONS.some((d) => d.value === durationParam)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('duration', '3months');
        return next;
      });
    }
  }, [durationParam, setSearchParams, renewalEnrollmentId]);

  useEffect(() => {
    setAppliedCode(null);
    setCodeError(null);
  }, [duration, renewalEnrollmentId]);

  const batch = teacher?.batches?.[effectiveBatchIndex];
  const months = durationMeta.months;
  const durationDiscountPct = durationMeta.discount;

  useEffect(() => {
    if (!isSwitchFlow || !switchEnrollmentId || !teacherId || !batch) {
      setSwitchPreview(null);
      setSwitchPreviewError(null);
      setSwitchPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setSwitchPreviewLoading(true);
    setSwitchPreviewError(null);
    const q = new URLSearchParams({
      enrollmentId: switchEnrollmentId,
      teacherId: teacherId || teacher._id,
      batchIndex: String(effectiveBatchIndex),
      duration,
    });
    apiJson<{
      studentId?: string;
      studentName?: string;
      oldTeacherName?: string;
      newTeacherName?: string;
      prorataBreakdown: TeacherSwitchPreview['prorataBreakdown'];
    }>(`/api/parent/switch-prorata-preview?${q.toString()}`)
      .then((d) => {
        if (cancelled) return;
        setSwitchPreview({
          studentId: d.studentId,
          studentName: d.studentName,
          oldTeacherName: d.oldTeacherName,
          newTeacherName: d.newTeacherName,
          prorataBreakdown: d.prorataBreakdown,
        });
        if (d.studentId) setSelectedStudentId(d.studentId);
      })
      .catch((e) => {
        if (!cancelled) setSwitchPreviewError(e instanceof Error ? e.message : 'Could not load switch preview');
      })
      .finally(() => {
        if (!cancelled) setSwitchPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSwitchFlow, switchEnrollmentId, teacherId, teacher, effectiveBatchIndex, duration, batch]);

  const baseSubtotal = batch?.feePerMonth ? batch.feePerMonth * months : 0;
  const durationDiscountAmount = batch?.feePerMonth
    ? Math.round(batch.feePerMonth * months * (durationDiscountPct / 100))
    : 0;
  const amountAfterDuration = useMemo(() => {
    if (isRenewalFlow && renewalPreview) {
      return renewalPreview.baseAfterDuration;
    }
    if (!batch?.feePerMonth) return 0;
    if (isSwitchFlow && switchPreview?.prorataBreakdown) {
      return switchPreview.prorataBreakdown.subtotalAfterCredit;
    }
    return Math.round(batch.feePerMonth * months * (1 - durationDiscountPct / 100));
  }, [
    batch,
    months,
    durationDiscountPct,
    isSwitchFlow,
    switchPreview,
    isRenewalFlow,
    renewalPreview,
  ]);
  const totalAmount = appliedCode ? appliedCode.finalAmount : amountAfterDuration;
  const promoDiscountAmount = appliedCode?.discountAmount ?? 0;

  const allAccepted =
    isRenewalFlow || (platformTerms && refundPolicy && courseOwnership);

  const selectedChild = useMemo(
    () => children.find((c) => String(c._id) === selectedStudentId),
    [children, selectedStudentId]
  );

  const boardClassMismatch = useMemo(() => {
    if (isRenewalFlow) return false;
    if (!batch || !selectedChild) return false;
    const bb = normStr(batch.board);
    const bc = normStr(batch.classLevel);
    const sb = normStr(selectedChild.board);
    const sc = normStr(selectedChild.classLevel);
    if (!bb || !bc) return false;
    if (!sb || !sc) return true;
    return bb !== sb || bc !== sc;
  }, [batch, selectedChild, isRenewalFlow]);

  const learnersForUi = useMemo(() => {
    if (isSwitchFlow && switchPreview?.studentId) {
      return children.filter((c) => String(c._id) === switchPreview.studentId);
    }
    return children;
  }, [children, isSwitchFlow, switchPreview?.studentId]);

  const canSubmitStudent =
    !!selectedStudentId &&
    (!isRenewalFlow || !!renewalPreview) &&
    (!isSwitchFlow || (!switchPreviewLoading && !switchPreviewError && !!switchPreview?.prorataBreakdown));

  const handleApplyCode = async () => {
    if (!discountCodeInput.trim() || !batch) return;
    setCodeError(null);
    setValidatingCode(true);
    try {
      const res = await apiJson<{ valid: boolean; message?: string; discountAmount?: number; finalAmount?: number }>(
        '/api/parent/discount/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            code: discountCodeInput.trim(),
            amountBeforeCode: amountAfterDuration,
            board: batch.board || '',
            classLevel: batch.classLevel || '',
          }),
        }
      );
      if (res.valid && res.discountAmount != null && res.finalAmount != null) {
        setAppliedCode({ code: discountCodeInput.trim().toUpperCase(), discountAmount: res.discountAmount, finalAmount: res.finalAmount });
      } else {
        setCodeError(res.message || 'Invalid code');
        setAppliedCode(null);
      }
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Failed to validate code');
      setAppliedCode(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleRemoveCode = () => {
    setDiscountCodeInput('');
    setAppliedCode(null);
    setCodeError(null);
  };

  const performCheckout = useCallback(async () => {
    if (isRenewalFlow && renewalEnrollmentId) {
      if (!renewalPreview) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await apiJson<{ pendingId: string; paymentUrl: string; totalAmount: number }>(
          '/api/parent/checkout',
          {
            method: 'POST',
            body: JSON.stringify({
              renewalEnrollmentId,
              totalAmount,
              discountCode: appliedCode?.code || undefined,
            }),
          }
        );
        navigate(res.paymentUrl || `/parent/payment?pendingId=${res.pendingId}`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Checkout failed');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!teacherId || batchIndex === undefined || !batch || !selectedStudentId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        teacherId,
        batchIndex,
        duration,
        totalAmount,
        feePerMonth: batch.feePerMonth,
        discount: durationDiscountPct,
        discountCode: appliedCode?.code || undefined,
        platformTermsAccepted: true,
        refundPolicyAccepted: true,
        courseOwnershipRulesAccepted: true,
        studentId: selectedStudentId,
        ...(switchEnrollmentId ? { replacesEnrollmentId: switchEnrollmentId } : {}),
      };

      const res = await apiJson<{ pendingId: string; paymentUrl: string; totalAmount: number }>(
        '/api/parent/checkout',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      navigate(res.paymentUrl || `/parent/payment?pendingId=${res.pendingId}`);
    } catch (err) {
      const data = err instanceof ApiError ? (err.data as { required?: Record<string, boolean> } | undefined) : undefined;
      if (data?.required) {
        setSubmitError('Please accept all three agreements to proceed.');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Checkout failed');
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    isRenewalFlow,
    renewalEnrollmentId,
    renewalPreview,
    totalAmount,
    appliedCode,
    navigate,
    teacherId,
    batchIndex,
    batch,
    selectedStudentId,
    duration,
    durationDiscountPct,
    switchEnrollmentId,
  ]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAccepted || !canSubmitStudent) return;
    if (isRenewalFlow) {
      if (!renewalPreview) return;
      void performCheckout();
      return;
    }
    if (!teacherId || batchIndex === undefined || !batch) return;
    if (boardClassMismatch) {
      setMismatchModalOpen(true);
      return;
    }
    void performCheckout();
  };

  const handleConfirmMismatchCheckout = () => {
    setMismatchModalOpen(false);
    void performCheckout();
  };

  const handleAddKidSuccess = (payload: AddStudentSuccessPayload) => {
    setAddKidDrawerOpen(false);
    setCredentialsModal(payload);
    apiJson<{ children: ChildRow[] }>('/api/parent/students')
      .then((s) => {
        const list = s.children || [];
        setChildren(list);
        const added = list.find((c) => c.studentId === payload.studentId);
        if (added) setSelectedStudentId(String(added._id));
        else if (list.length) setSelectedStudentId(String(list[list.length - 1]._id));
      })
      .catch(() => {});
  };

  const slotSummary = useMemo(() => {
    if (!batch?.slots?.length) return null;
    return batch.slots
      .slice(0, 4)
      .map((s) => `${s.day} ${s.startTime}–${s.endTime}`)
      .join(' · ');
  }, [batch]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-600">
          {renewalEnrollmentId ? 'Loading your renewal…' : 'Preparing your checkout…'}
        </p>
      </div>
    );
  }
  if (error) return <InlineErrorDisplay error={error} onRetry={() => window.location.reload()} fullPage />;
  if (!teacher) return <div className="mx-auto max-w-lg px-4 py-12 text-center text-red-600">Teacher not found.</div>;
  if (!batch) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-lg font-semibold text-brand-900">Batch not found</p>
        <p className="mt-2 text-sm text-gray-600">This link may be invalid. Open the teacher profile and pick a batch again.</p>
        {(teacherId || teacher?._id) && (
          <Link
            to={`/parent/teacher/${teacherId || teacher?._id}`}
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
          >
            Back to teacher profile
          </Link>
        )}
      </div>
    );
  }
  if (!isRenewalFlow && batch.hideFromParents) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-lg font-semibold text-brand-900">This batch isn’t open for enrollment</p>
        <p className="mt-2 text-sm text-gray-600">
          It may be full, closed, inactive, or starting within a week. Choose another batch from the teacher’s profile.
        </p>
        {(teacherId || teacher?._id) && (
          <Link
            to={`/parent/teacher/${teacherId || teacher?._id}`}
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-700"
          >
            Back to teacher profile
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full pb-16 pt-2">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-white to-amber-50/80" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-brand-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-32 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl" />

      <div className="relative mx-auto px-4 sm:px-6">
        <div className="mb-8 animate-fade-in text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600/90">
            {isRenewalFlow ? 'Renewal' : isSwitchFlow ? 'Switching teachers' : 'Almost there'}
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-brand-700 via-violet-700 to-brand-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            {isRenewalFlow
              ? 'Pay for your next period'
              : isSwitchFlow
                ? 'Complete your teacher switch'
                : 'Complete enrollment'}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600">
            {isRenewalFlow
              ? 'Same course and billing length as your enrollment — review the period, apply a promo if you have one, then pay.'
              : isSwitchFlow
                ? 'We split this month fairly between your previous and new teacher — then you pay the adjusted package price.'
                : 'Review your course, pick duration savings, apply an optional promo code, and confirm agreements.'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
          {/* Teacher + course card */}
          <div className="animate-slide-up min-w-0 space-y-6 lg:col-span-3" style={{ animationDelay: '0.05s' }}>
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/80 bg-white/95 p-6 shadow-xl shadow-brand-900/5 ring-1 ring-brand-100/60 backdrop-blur-sm sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-200/30 blur-2xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="relative mx-auto shrink-0 sm:mx-0">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg ring-2 ring-brand-200/80 sm:h-28 sm:w-28">
                    {(() => {
                      const ph = resolveMediaUrl(teacher.photoUrl);
                      return ph ? (
                      <img src={ph} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-violet-100 text-4xl">
                        👩‍🏫
                      </div>
                    );
                    })()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm shadow-md">
                    ✓
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-brand-900 sm:text-2xl">{teacher.name}</h2>
                  <p className="mt-1 text-sm font-medium text-brand-700">
                    {batch.name || `${batch.subject} · ${batch.board} · Class ${batch.classLevel}`}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {batch.subject} · {batch.board} · Class {batch.classLevel}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {batch.enrolledCount ?? 0} of {batch.maxStudents ?? 3} students enrolled in this batch
                  </p>
                  {slotSummary && (
                    <p className="mt-2 flex items-start justify-center gap-2 text-xs text-gray-500 sm:justify-start">
                      <span className="mt-0.5 text-base" aria-hidden>
                        🕐
                      </span>
                      <span>{slotSummary}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isRenewalFlow && renewalPreview && (
              <div className="animate-slide-up relative overflow-hidden rounded-3xl border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-brand-50/40 p-6 shadow-xl ring-1 ring-emerald-100/80 sm:p-7">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-brand-100 text-lg shadow-inner">
                    📆
                  </span>
                  Months covered by this payment
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>{renewalPreview.months} months</strong> — same billing package as your enrollment (
                  {durationMeta.label}
                  {renewalPreview.discountPercent > 0 ? ` · ${renewalPreview.discountPercent}% plan discount` : ''}).
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>
                    <span className="font-semibold text-gray-500">Current period ends:</span>{' '}
                    {formatDate(renewalPreview.currentPeriodEnd)}
                  </li>
                  {renewalPreview.extendedPeriodEnd && (
                    <li>
                      <span className="font-semibold text-gray-500">After payment, access through:</span>{' '}
                      {formatDate(renewalPreview.extendedPeriodEnd)}
                    </li>
                  )}
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  Learner and agreements from your original purchase apply — you’re extending the same enrollment.
                </p>
              </div>
            )}

            {/* Teacher switch — pro-rata this month */}
            {isSwitchFlow && (
              <div className="animate-slide-up relative overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-6 shadow-xl ring-1 ring-amber-100/80 sm:p-7">
                <div className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full bg-violet-300/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl" />
                <h3 className="relative mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-900">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-violet-200 text-xl shadow-inner">
                    ⚖️
                  </span>
                  Fair split for this month
                </h3>
                {switchPreviewLoading && (
                  <div className="relative flex items-center gap-3 py-6 text-sm font-medium text-brand-700">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Calculating calendar pro-rata…
                  </div>
                )}
                {switchPreviewError && (
                  <p className="relative rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{switchPreviewError}</p>
                )}
                {switchPreview?.prorataBreakdown && !switchPreviewLoading && (
                  <div className="relative space-y-4 text-sm">
                    <p className="text-brand-800">
                      <span className="font-bold">{switchPreview.oldTeacherName || 'Previous teacher'}</span> ·{' '}
                      <span className="text-gray-600">
                        share for days already in this month ({switchPreview.prorataBreakdown.elapsedDays} day
                        {switchPreview.prorataBreakdown.elapsedDays === 1 ? '' : 's'})
                      </span>
                      <span className="ml-2 font-bold text-brand-900">
                        {formatCurrency(switchPreview.prorataBreakdown.oldTeacherEarnedThisMonth)}
                      </span>
                    </p>
                    <p className="text-brand-800">
                      <span className="font-bold">{switchPreview.newTeacherName || teacher.name}</span> ·{' '}
                      <span className="text-gray-600">new package ({durationMeta.label}) after duration discount</span>
                      <span className="ml-2 font-bold text-brand-900">
                        {formatCurrency(switchPreview.prorataBreakdown.basePackageAfterDurationDiscount)}
                      </span>
                    </p>
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 font-semibold text-emerald-900">
                      Credit from unused days this month at your old rate ({switchPreview.prorataBreakdown.remainingDays}{' '}
                      day{switchPreview.prorataBreakdown.remainingDays === 1 ? '' : 's'} left):{' '}
                      −{formatCurrency(switchPreview.prorataBreakdown.creditFromOldUnusedMonth)}
                    </p>
                    <p className="text-base font-extrabold text-brand-900">
                      Adjusted amount before promo code: {formatCurrency(switchPreview.prorataBreakdown.subtotalAfterCredit)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Duration — hidden for renewal (locked to existing enrollment) */}
            {!isRenewalFlow && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/80 bg-gradient-to-br from-white via-brand-50/40 to-accent-50/30 p-6 shadow-lg ring-1 ring-brand-100/50 sm:p-7">
              <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-brand-200/20 blur-2xl" />
              <h3 className="relative mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-violet-100 text-lg shadow-inner">
                  ⏱️
                </span>
                {isSwitchFlow ? 'Package length with new teacher' : 'Billing period'}
              </h3>
              <p className="relative mb-4 text-sm text-gray-600">
                Longer plans include a built-in discount. You can change this anytime before payment.
              </p>
              <div className="relative grid gap-3 sm:grid-cols-3">
                {DURATIONS.map((d) => {
                  const active = duration === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDuration(d.value)}
                      className={`group relative flex flex-col rounded-2xl border-2 px-4 py-4 text-left transition-all duration-200 ${
                        active
                          ? 'border-brand-500 bg-white shadow-lg ring-2 ring-brand-400/40'
                          : 'border-brand-100/80 bg-white/70 hover:border-brand-300 hover:shadow-md'
                      }`}
                    >
                      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{d.emoji}</span>
                      <span className="mt-2 font-bold text-brand-900">{d.label}</span>
                      <span
                        className={`mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          d.discount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {d.badge}
                      </span>
                      {active && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* Who is this for — hidden for renewal (learner already on enrollment) */}
            {!isRenewalFlow && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/80 bg-white/95 p-5 shadow-lg sm:p-7">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-lg">
                  👧
                </span>
                Who is this course for?
              </h3>
              <p className="mb-5 text-sm text-gray-600">
                {isSwitchFlow
                  ? 'This switch stays with the same learner as the current enrollment.'
                  : 'Select a learner for this enrollment. This batch is for'}{' '}
                {!isSwitchFlow && (
                  <strong>
                    {batch.board} · Class {batch.classLevel}
                  </strong>
                )}
                {!isSwitchFlow ? '.' : ''}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {isSwitchFlow && learnersForUi.length === 0 && switchPreview?.studentName && (
                  <div className="flex w-full gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50/80 p-4 sm:col-span-2">
                    <span className="text-2xl" aria-hidden>
                      🎒
                    </span>
                    <div>
                      <p className="font-extrabold text-brand-900">{switchPreview.studentName}</p>
                      <p className="text-xs text-gray-600">Learner for this teacher switch</p>
                    </div>
                  </div>
                )}
                {learnersForUi.map((c) => {
                  const selected = String(c._id) === selectedStudentId;
                  const av = childAvatarUrl(c.photoUrl);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => setSelectedStudentId(String(c._id))}
                      className={`flex w-full gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition sm:p-5 ${
                        selected
                          ? 'border-brand-500 bg-gradient-to-br from-brand-50/90 to-white ring-2 ring-brand-400/35 shadow-md'
                          : 'border-brand-100 bg-white hover:border-brand-300 hover:shadow-md'
                      }`}
                    >
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-brand-50 shadow-md ring-2 ring-brand-100 sm:h-32 sm:w-32">
                        {av ? (
                          <img src={av} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-violet-100 text-5xl">
                            👤
                          </div>
                        )}
                        {selected && (
                          <span className="absolute bottom-2 right-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-lg font-extrabold leading-snug text-brand-900 sm:text-xl">{c.name || 'Student'}</p>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="font-bold text-gray-500">Board</dt>
                            <dd className="font-semibold text-gray-900">{c.board || '—'}</dd>
                          </div>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            <dt className="font-bold text-gray-500">Class</dt>
                            <dd className="font-semibold text-gray-900">{c.classLevel || '—'}</dd>
                          </div>
                          {c.schoolName?.trim() && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                              <dd className="font-medium text-gray-800">{c.schoolName}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </button>
                  );
                })}

                {!isSwitchFlow && (
                <button
                  type="button"
                  onClick={() => setAddKidDrawerOpen(true)}
                  className="flex min-h-[8.5rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-gradient-to-br from-brand-50/60 to-white p-6 text-center shadow-inner transition hover:border-brand-500 hover:bg-brand-50/80 sm:min-h-[9.5rem]"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brand-200 bg-white text-3xl shadow-sm">
                    ➕
                  </span>
                  <div>
                    <p className="text-base font-extrabold text-brand-900">Add another kid</p>
                    <p className="mt-1 text-xs text-gray-600">Photo &amp; ID · opens in drawer</p>
                  </div>
                </button>
                )}
              </div>

              {!isSwitchFlow && children.length === 0 && (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  Add a learner profile to continue — use <strong>Add kid</strong> (photo &amp; ID required).
                </p>
              )}

              {selectedChild && boardClassMismatch && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                  <strong>Note:</strong> This batch is for {batch.board} · Class {batch.classLevel}, but{' '}
                  <strong>{selectedChild.name || 'this learner'}</strong> is listed as{' '}
                  {selectedChild.board || '—'} · {selectedChild.classLevel || '—'}. We’ll ask you to confirm before
                  payment.
                </p>
              )}

              <p className="mt-4 text-xs text-gray-500">
                The learner you choose here is the one enrolled for this course when you pay. Manage profiles anytime in{' '}
                <Link to="/parent/students" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                  My kids
                </Link>
                .
              </p>
            </div>
            )}

            {/* Promo code - separate card */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-violet-200/90 bg-gradient-to-br from-violet-50/80 to-white p-6 shadow-md sm:p-7">
              <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-violet-200/30 blur-xl" />
              <h3 className="relative mb-3 flex items-center gap-2 text-base font-bold text-violet-900">
                <span className="text-xl" aria-hidden>
                  🎟️
                </span>
                Promo code (optional)
              </h3>
              <p className="relative mb-4 text-sm text-violet-900/70">
                {isRenewalFlow
                  ? 'Have a code? Apply it here — it applies on top of your plan discount in the summary.'
                  : 'Have a code? Apply it here — it stacks after your duration discount in the calculation below.'}
              </p>
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  type="text"
                  value={discountCodeInput}
                  onChange={(e) => {
                    setDiscountCodeInput(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  placeholder="ENTER CODE"
                  disabled={!!appliedCode}
                  className="min-h-[48px] flex-1 rounded-xl border border-violet-200 bg-white px-4 py-3 font-mono text-sm font-semibold tracking-wide text-violet-950 shadow-inner placeholder:text-violet-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60"
                />
                {appliedCode ? (
                  <button
                    type="button"
                    onClick={handleRemoveCode}
                    className="rounded-xl border-2 border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCode}
                    disabled={validatingCode || !discountCodeInput.trim()}
                    className="min-h-[48px] shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-violet-700 hover:to-brand-700 disabled:opacity-50"
                  >
                    {validatingCode ? 'Applying…' : 'Apply'}
                  </button>
                )}
              </div>
              {appliedCode && (
                <p className="relative mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  {appliedCode.code} saved you {formatCurrency(appliedCode.discountAmount)}
                </p>
              )}
              {codeError && <p className="relative mt-2 text-sm font-medium text-red-600">{codeError}</p>}
            </div>

            {/* Agreements — skipped for renewal (already accepted on original purchase) */}
            {isRenewalFlow ? (
              <form
                onSubmit={handleFormSubmit}
                className="relative overflow-hidden rounded-3xl border-2 border-brand-200/90 bg-gradient-to-br from-white to-brand-50/40 p-6 shadow-lg sm:p-7"
              >
                <p className="text-sm text-gray-600">
                  You’re paying the next installment for an active enrollment — platform terms and policies from your
                  original signup still apply.
                </p>
                {submitError && <p className="mt-4 text-sm font-medium text-red-600">{submitError}</p>}
                <button
                  type="submit"
                  disabled={!allAccepted || submitting || !canSubmitStudent}
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-lg transition hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Continue to payment · {formatCurrency(totalAmount)}
                      <span aria-hidden>→</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleFormSubmit} className="relative overflow-hidden rounded-3xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white p-6 shadow-lg sm:p-7">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-950">
                  <span className="text-xl" aria-hidden>
                    📜
                  </span>
                  Agreements
                </h3>
                <p className="mb-5 text-sm text-amber-900/80">Read each document in the modal, then tick to confirm.</p>

                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/60 bg-white/80 p-3 transition hover:border-amber-300">
                    <input
                      type="checkbox"
                      checked={platformTerms}
                      onChange={(e) => setPlatformTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-800">
                      I agree to the{' '}
                      <button
                        type="button"
                        className="font-semibold text-brand-700 underline decoration-2 underline-offset-2 hover:text-brand-900"
                        onClick={() => setTermsModal('platform')}
                      >
                        Platform Terms & Conditions
                      </button>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/60 bg-white/80 p-3 transition hover:border-amber-300">
                    <input
                      type="checkbox"
                      checked={refundPolicy}
                      onChange={(e) => setRefundPolicy(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-800">
                      I agree to the{' '}
                      <button
                        type="button"
                        className="font-semibold text-brand-700 underline decoration-2 underline-offset-2 hover:text-brand-900"
                        onClick={() => setTermsModal('refund')}
                      >
                        Refund Policy
                      </button>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/60 bg-white/80 p-3 transition hover:border-amber-300">
                    <input
                      type="checkbox"
                      checked={courseOwnership}
                      onChange={(e) => setCourseOwnership(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-800">
                      I agree to the{' '}
                      <button
                        type="button"
                        className="font-semibold text-brand-700 underline decoration-2 underline-offset-2 hover:text-brand-900"
                        onClick={() => setTermsModal('course')}
                      >
                        Course Ownership & Usage Rules
                      </button>
                    </span>
                  </label>
                </div>

                {submitError && <p className="mt-4 text-sm font-medium text-red-600">{submitError}</p>}

                <button
                  type="submit"
                  disabled={!allAccepted || submitting || !canSubmitStudent}
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow-lg transition hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Continue to payment · {formatCurrency(totalAmount)}
                      <span aria-hidden>→</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Summary column — sticky on lg+ (no animate-slide-up here: transform breaks position:sticky) */}
          <div className="min-w-0 lg:col-span-2 sticky top-24">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:z-30 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-2 lg:pt-1">
              <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200/90 bg-gradient-to-b from-white to-brand-50/50 p-6 shadow-2xl ring-1 ring-brand-100/80">
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-brand-300/20 blur-2xl" />
                <h3 className="relative mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-800">
                  <span className="text-lg" aria-hidden>
                    🧾
                  </span>
                  Price breakdown
                </h3>

                <dl className="relative space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-gray-700">
                    <dt>Monthly fee</dt>
                    <dd className="font-semibold tabular-nums text-gray-900">{formatCurrency(batch.feePerMonth ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-gray-700">
                    <dt>
                      × {months} months <span className="text-gray-500">(subtotal)</span>
                    </dt>
                    <dd className="font-semibold tabular-nums text-gray-900">{formatCurrency(baseSubtotal)}</dd>
                  </div>
                  {durationDiscountPct > 0 && (
                    <div className="flex justify-between gap-4 text-emerald-800">
                      <dt>Plan discount ({durationDiscountPct}%)</dt>
                      <dd className="font-semibold tabular-nums">−{formatCurrency(durationDiscountAmount)}</dd>
                    </div>
                  )}
                  <div className="border-t border-brand-200/80 pt-3">
                    <div className="flex justify-between gap-4 font-semibold text-brand-900">
                      <dt>After plan savings</dt>
                      <dd className="tabular-nums">{formatCurrency(amountAfterDuration)}</dd>
                    </div>
                  </div>
                  {appliedCode && (
                    <div className="flex justify-between gap-4 text-violet-800">
                      <dt>Promo ({appliedCode.code})</dt>
                      <dd className="font-semibold tabular-nums">−{formatCurrency(promoDiscountAmount)}</dd>
                    </div>
                  )}
                </dl>

                <div className="relative mt-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-600 to-violet-600 p-[2px] shadow-lg">
                  <div className="rounded-[14px] bg-white px-4 py-4 sm:px-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Total payable</p>
                    <p className="mt-1 text-3xl font-black tabular-nums text-brand-900 sm:text-4xl">{formatCurrency(totalAmount)}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      Includes GST as applicable · Secure payment on the next step
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-4 text-center text-xs text-gray-500 shadow-sm">
                Questions?{' '}
                <Link to="/parent/dashboard" className="font-semibold text-brand-700 hover:underline">
                  Back to dashboard
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <CmsContentModal
        isOpen={termsModal === 'platform'}
        onClose={() => setTermsModal(null)}
        slug="terms-conditions"
        titleFallback="Terms & Conditions"
      />
      <CmsContentModal
        isOpen={termsModal === 'refund'}
        onClose={() => setTermsModal(null)}
        slug="refund-policy"
        titleFallback="Refund Policy"
      />
      <CmsContentModal
        isOpen={termsModal === 'course'}
        onClose={() => setTermsModal(null)}
        slug="course-ownership-rules"
        titleFallback="Course Ownership Rules"
      />

      <Drawer
        isOpen={addKidDrawerOpen}
        onClose={() => setAddKidDrawerOpen(false)}
        title="Add learner"
        subtitle="Photo & ID required — they’ll appear in the row above"
        headerIcon="👋"
        widthClassName="max-w-full sm:max-w-xl"
      >
        <AddEditStudentForm
          onSuccess={handleAddKidSuccess}
          onCancel={() => setAddKidDrawerOpen(false)}
        />
      </Drawer>

      {credentialsModal && (
        <StudentCredentialsModal
          isOpen
          onClose={() => setCredentialsModal(null)}
          studentName={credentialsModal.name}
          loginId={credentialsModal.studentId}
          password={credentialsModal.password}
        />
      )}

      <Modal isOpen={mismatchModalOpen} onClose={() => setMismatchModalOpen(false)} maxWidth="max-w-lg">
        <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
            <h2 className="text-lg font-bold text-white">Board &amp; class don’t match</h2>
            <p className="mt-1 text-sm text-white/90">Please confirm before continuing to payment.</p>
          </div>
          <div className="space-y-3 px-5 py-4 text-sm text-gray-700">
            <p>
              This course batch is for{' '}
              <strong>
                {batch.board} · Class {batch.classLevel}
              </strong>
              .
            </p>
            <p>
              The learner you selected (<strong>{selectedChild?.name || 'Student'}</strong>) is on file as{' '}
              <strong>
                {selectedChild?.board || '—'} · Class {selectedChild?.classLevel || '—'}
              </strong>
              .
            </p>
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-950">
              If you continue, this enrollment will still be tied to <strong>{selectedChild?.name || 'this learner'}</strong>.
              Make sure that’s what you want, or pick another learner / find a batch that matches their board &amp; class.
            </p>
          </div>
          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setMismatchModalOpen(false)}
              className="rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100"
            >
              Go back
            </button>
            <button type="button" onClick={handleConfirmMismatchCheckout} className="btn-primary rounded-xl px-5 py-3 text-sm font-bold">
              I understand — continue to payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
