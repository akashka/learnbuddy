import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { TrustBadges } from '@/components/TrustBadges';

interface Batch {
  name?: string;
  subject?: string;
  board?: string;
  classLevel?: string;
  feePerMonth?: number;
  slots?: { day?: string; startTime?: string; endTime?: string }[];
}

interface Teacher {
  _id: string;
  name?: string;
  batches?: Batch[];
}

const DURATIONS = [
  { value: '3months', label: '3 months', discount: 0 },
  { value: '6months', label: '6 months', discount: 5 },
  { value: '12months', label: '12 months', discount: 10 },
];

export default function ParentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teacherId = searchParams.get('teacherId');
  const batchIndex = parseInt(searchParams.get('batchIndex') || '0', 10);
  const duration = searchParams.get('duration') || '3months';

  const [teacher, setTeacher] = useState<Teacher | null>(null);
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

  useEffect(() => {
    if (!teacherId) {
      setError('Missing teacher. Go to Marketplace to select a teacher.');
      setLoading(false);
      return;
    }
    apiJson<Teacher>(`/api/teachers/${teacherId}`)
      .then(setTeacher)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [teacherId]);

  const batch = teacher?.batches?.[batchIndex];
  const months = duration === '3months' ? 3 : duration === '6months' ? 6 : 12;
  const discount = DURATIONS.find((d) => d.value === duration)?.discount ?? 0;
  const amountAfterDuration = batch?.feePerMonth
    ? Math.round(batch.feePerMonth * months * (1 - discount / 100))
    : 0;
  const totalAmount = appliedCode ? appliedCode.finalAmount : amountAfterDuration;

  const allAccepted = platformTerms && refundPolicy && courseOwnership;

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || batchIndex === undefined || !batch || !allAccepted) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiJson<{ pendingId: string; paymentUrl: string; totalAmount: number }>(
        '/api/parent/checkout',
        {
          method: 'POST',
          body: JSON.stringify({
            teacherId,
            batchIndex,
            duration,
            totalAmount,
            feePerMonth: batch.feePerMonth,
            discount,
            discountCode: appliedCode?.code || undefined,
            platformTermsAccepted: true,
            refundPolicyAccepted: true,
            courseOwnershipRulesAccepted: true,
          }),
        }
      );
      navigate(res.paymentUrl || `/parent/payment?pendingId=${res.pendingId}`);
    } catch (err) {
      const data = (err as { data?: { required?: Record<string, boolean> } })?.data;
      if (data?.required) {
        setSubmitError('Please accept all three agreements to proceed.');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Checkout failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <InlineErrorDisplay error={error} onRetry={() => window.location.reload()} fullPage />;
  if (!teacher || !batch) return <div className="text-red-600">Teacher or batch not found.</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Checkout</h1>
      <TrustBadges variant="compact" className="mb-6" />

      <div className="mb-6 rounded-xl border border-brand-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-brand-800">Course Summary</h2>
        <p><strong>Teacher:</strong> {teacher.name}</p>
        <p><strong>Batch:</strong> {batch.name} – {batch.subject} ({batch.board} Class {batch.classLevel})</p>
        <p><strong>Duration:</strong> {months} months {discount > 0 && `(${discount}% discount)`}</p>
        <p><strong>Subtotal:</strong> ₹{amountAfterDuration}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={discountCodeInput}
            onChange={(e) => { setDiscountCodeInput(e.target.value.toUpperCase()); setCodeError(null); }}
            placeholder="Discount code"
            className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-mono uppercase"
            disabled={!!appliedCode}
          />
          {appliedCode ? (
            <span className="flex items-center gap-2 text-green-600">
              <span>{appliedCode.code} applied (-₹{appliedCode.discountAmount})</span>
              <button type="button" onClick={handleRemoveCode} className="text-red-600 hover:underline text-sm">Remove</button>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleApplyCode}
              disabled={validatingCode || !discountCodeInput.trim()}
              className="rounded-lg border border-brand-600 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 disabled:opacity-50"
            >
              {validatingCode ? 'Checking...' : 'Apply'}
            </button>
          )}
        </div>
        {codeError && <p className="mt-1 text-sm text-red-600">{codeError}</p>}
        <p className="mt-2 font-semibold"><strong>Total:</strong> ₹{totalAmount}</p>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-3 font-semibold text-amber-800">Agreements Required</h2>
          <p className="mb-4 text-sm text-gray-600">
            You must accept the following to complete your purchase:
          </p>

          <label className="mb-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={platformTerms}
              onChange={(e) => setPlatformTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{' '}
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                Platform Terms & Conditions
              </a>
            </span>
          </label>

          <label className="mb-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={refundPolicy}
              onChange={(e) => setRefundPolicy(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{' '}
              <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                Refund Policy
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={courseOwnership}
              onChange={(e) => setCourseOwnership(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{' '}
              <a href="/course-ownership-rules" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                Course Ownership & Usage Rules
              </a>
            </span>
          </label>
        </div>

        {submitError && <p className="text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={!allAccepted || submitting}
          className="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : `Proceed to Payment (₹${totalAmount})`}
        </button>
      </form>
    </div>
  );
}
