import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api';
import { formatCurrency } from '@shared/formatters';

interface Pending {
  _id: string;
  subject?: string;
  totalAmount?: number;
  paymentStatus?: string;
}

export default function ParentPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pendingId = searchParams.get('pendingId');
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!pendingId) {
      setError('Missing pending ID');
      setLoading(false);
      return;
    }
    apiJson<Pending>(`/api/parent/pending/${pendingId}`)
      .then(setPending)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [pendingId]);

  const handleComplete = async () => {
    if (!pendingId) return;
    setCompleting(true);
    try {
      await apiJson('/api/parent/payment/complete', {
        method: 'POST',
        body: JSON.stringify({ pendingId }),
      });
      navigate('/parent/students', { state: { message: 'Payment complete! Add student details.' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error && !pending) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Payment</h1>
      {pending ? (
        <div className="rounded-xl border border-brand-200 bg-white p-6">
          <p><strong>Course:</strong> {pending.subject}</p>
          <p><strong>Amount:</strong> {formatCurrency(pending.totalAmount ?? 0)}</p>
          <p className="mb-4 text-sm text-gray-600">
            (In production, integrate with payment gateway here)
          </p>
          <button
            onClick={handleComplete}
            disabled={completing || pending.paymentStatus === 'completed'}
            className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {completing ? 'Processing...' : pending.paymentStatus === 'completed' ? 'Already paid' : 'Complete Payment'}
          </button>
        </div>
      ) : (
        <p className="text-gray-600">Pending enrollment not found.</p>
      )}
    </div>
  );
}
