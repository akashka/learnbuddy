import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { apiJson } from '@/lib/api';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { PageHeader } from '@/components/PageHeader';
import { formatDateTime, formatCurrency } from '@shared/formatters';

interface Agreement {
  type: string;
  label: string;
  content: string;
  signed?: { version: string; signedAt: string; ipAddress?: string };
}

const TYPE_ICONS: Record<string, string> = {
  commission_model: '💰',
  payment_terms: '📋',
  conduct_rules: '✨',
};

const TYPE_COLORS: Record<string, string> = {
  commission_model: 'from-amber-100 to-orange-100',
  payment_terms: 'from-blue-100 to-indigo-100',
  conduct_rules: 'from-emerald-100 to-teal-100',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  commission_model: 'How GuruChakra charges commission from your tuition fees.',
  payment_terms: 'When and how you receive payments for your classes.',
  conduct_rules: 'Guidelines for safe, respectful teaching on the platform.',
};

function downloadAgreement(a: Agreement, signed: boolean) {
  const baseHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a.label}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6}h1,h2{color:#3730a3}hr{margin:2rem 0}</style></head><body>`;
  const content = a.content || '<p>No content available.</p>';
  const signedBlock = signed && a.signed
    ? `<hr><h2>Signature Record</h2><p><strong>Signed:</strong> ${new Date(a.signed.signedAt).toLocaleString()}<br><strong>Version:</strong> ${a.signed.version}${a.signed.ipAddress ? `<br><strong>IP:</strong> ${a.signed.ipAddress}` : ''}</p>`
    : '';
  const fullHtml = baseHtml + content + signedBlock + '</body></html>';
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const aEl = document.createElement('a');
  aEl.href = url;
  aEl.download = `${a.label.replace(/\s+/g, '-')}-${signed ? 'signed' : 'unsigned'}.html`;
  aEl.click();
  URL.revokeObjectURL(url);
}

function DocumentModal({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sanitized = DOMPurify.sanitize(content || '', {
    ADD_ATTR: ['target', 'rel'],
    ADD_TAGS: ['iframe'],
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-[95vw] max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <h2 id="doc-modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div
            className="prose max-w-none prose-headings:text-brand-800 prose-p:text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        </div>
        <div className="shrink-0 border-t border-brand-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full"
          >
            <span className="btn-text">Close</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CommissionInfoModal({
  isOpen,
  onClose,
  commissionPercent,
}: {
  isOpen: boolean;
  onClose: () => void;
  commissionPercent: number;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const exampleFee = 5000;
  const commissionAmount = Math.round((exampleFee * commissionPercent) / 100);
  const teacherEarns = exampleFee - commissionAmount;

  return createPortal(
    <div
      className="fixed inset-0 z-[105] flex min-h-screen items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commission-info-title"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <h2 id="commission-info-title" className="text-xl font-bold text-white">
            Understanding Your Commission
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          <div>
            <h3 className="font-semibold text-brand-800">What is the commission?</h3>
            <p className="mt-1 text-gray-700">
              GuruChakra charges a <strong>{commissionPercent}%</strong> commission on the tuition fees you collect from students. This is deducted from your gross earnings before you receive your payout.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-brand-800">How is it calculated?</h3>
            <p className="mt-1 text-gray-700">
              Commission = Tuition fee collected × {commissionPercent}%
            </p>
            <p className="mt-2 text-gray-700">
              Your payout = Tuition fee collected − Commission
            </p>
          </div>
          <div className="rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4">
            <h3 className="font-semibold text-brand-800">Example</h3>
            <p className="mt-2 text-gray-700">
              If a parent pays <strong>{formatCurrency(exampleFee)}</strong> for a month&apos;s tuition:
            </p>
            <ul className="mt-2 space-y-1 text-gray-700">
              <li>• Commission ({commissionPercent}%): {formatCurrency(commissionAmount)}</li>
              <li>• You receive: <strong className="text-green-700">{formatCurrency(teacherEarns)}</strong></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-brand-800">Why do we charge commission?</h3>
            <p className="mt-1 text-gray-700">
              The commission helps us maintain the platform, including student-teacher matching, secure payments, AI-powered class monitoring for safety, customer support, and continuous improvements to make GuruChakra better for everyone.
            </p>
          </div>
        </div>
        <div className="border-t border-brand-100 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            <span className="btn-text">Got it</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SignConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  label,
  loading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  loading: boolean;
  error: string | null;
}) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!isOpen) setAgreed(false);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex min-h-screen items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">✍️</div>
            <div>
              <h3 className="text-lg font-bold text-white">Sign & Approve</h3>
              <p className="text-sm text-white/90">{label}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-center text-sm text-gray-600">
            Please confirm you have read and agree to the terms below.
          </p>
          {error && (
            <div className="mt-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-brand-100 bg-brand-50/50 p-4 transition hover:border-brand-200">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">
            I have read and agree to the terms of this agreement. I understand this is a legally binding commitment.
          </span>
        </label>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            <span className="btn-text">Cancel</span>
          </button>
          <button
            type="button"
            onClick={() => agreed && onConfirm()}
            disabled={!agreed || loading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            <span className="btn-text">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing...
                </span>
              ) : (
                'Sign now'
              )}
            </span>
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TeacherAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);
  const [docModal, setDocModal] = useState<Agreement | null>(null);
  const [signModal, setSignModal] = useState<Agreement | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [commissionInfoOpen, setCommissionInfoOpen] = useState(false);

  const fetchAgreements = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiJson<{ agreements: Agreement[]; commissionPercent: number }>('/api/teacher/agreements');
      setAgreements(data.agreements || []);
      setCommissionPercent(data.commissionPercent ?? 10);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleSignClick = (a: Agreement) => {
    setSignError(null);
    setSignModal(a);
  };

  const handleSignConfirm = async () => {
    if (!signModal) return;
    setSigning(signModal.type);
    setSignError(null);
    try {
      await apiJson('/api/teacher/agreements/sign', {
        method: 'POST',
        body: JSON.stringify({ type: signModal.type }),
      });
      setSignModal(null);
      await fetchAgreements();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to sign. Please try again.';
      setSignError(msg);
    } finally {
      setSigning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
        <div className="flex gap-3">
          <span className="text-5xl animate-bounce-subtle">📋</span>
          <span className="text-5xl animate-bounce-subtle stagger-2">✍️</span>
          <span className="text-5xl animate-bounce-subtle stagger-4">✨</span>
        </div>
        <p className="font-display text-lg font-semibold text-brand-700 animate-pulse-soft">Loading agreements...</p>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }
  if (error && agreements.length === 0) {
    return <InlineErrorDisplay error={error} onRetry={fetchAgreements} fullPage />;
  }

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="📜"
        title="Agreements & Policies"
        subtitle={
          <span className="flex items-center gap-1.5">
            Commission: <strong>{commissionPercent}%</strong>
            <button
              type="button"
              onClick={() => setCommissionInfoOpen(true)}
              className="inline-flex rounded-full p-0.5 text-white/90 transition hover:bg-white/20"
              aria-label="Learn more about commission"
              title="Learn more about commission"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {agreements.map((a, idx) => (
          <div
            key={a.type}
            className="card-funky animate-slide-up relative overflow-hidden rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-accent-100 p-6 shadow-lg transition-all duration-300 hover:border-brand-300 hover:shadow-xl"
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent-200/25 blur-xl" />
            <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-brand-200/20 blur-lg" />
            <div className="relative mb-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${TYPE_COLORS[a.type] || 'from-brand-100 to-brand-200'} text-2xl shadow-md`}>
                {TYPE_ICONS[a.type] || '📄'}
              </div>
              <h2 className="font-display text-lg font-bold text-brand-800">{a.label}</h2>
            </div>
            <p className="relative mb-4 text-sm text-gray-600">
              {TYPE_DESCRIPTIONS[a.type] || 'Read the full document for details.'}
            </p>

            {a.signed ? (
              <div className="relative mt-4 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">Signed</span>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm text-green-700">
                  <div className="flex justify-between">
                    <dt>Date:</dt>
                    <dd>{formatDateTime(a.signed.signedAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Version:</dt>
                    <dd>{a.signed.version}</dd>
                  </div>
                  {a.signed.ipAddress && (
                    <div className="flex justify-between">
                      <dt>Signed from:</dt>
                      <dd className="font-mono text-xs">{a.signed.ipAddress}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              <div className="relative mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSignClick(a)}
                  disabled={!!signing}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
                >
                  ✍️ Sign & Approve
                </button>
              </div>
            )}

            <div className="relative mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDocModal(a)}
                className="flex-1 rounded-xl border-2 border-brand-200 bg-white py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                📖 View full document
              </button>
              <button
                type="button"
                onClick={() => downloadAgreement(a, !!a.signed)}
                className="rounded-xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
                title={a.signed ? 'Download signed copy' : 'Download unsigned copy'}
              >
                <span className="hidden sm:inline">Download </span>⬇️
              </button>
            </div>
          </div>
        ))}
      </div>

      <DocumentModal
        isOpen={!!docModal}
        onClose={() => setDocModal(null)}
        title={docModal?.label || ''}
        content={docModal?.content || ''}
      />

      <CommissionInfoModal
        isOpen={commissionInfoOpen}
        onClose={() => setCommissionInfoOpen(false)}
        commissionPercent={commissionPercent}
      />

      <SignConfirmModal
        isOpen={!!signModal}
        onClose={() => { setSignModal(null); setSignError(null); }}
        onConfirm={handleSignConfirm}
        label={signModal?.label || ''}
        loading={signing === signModal?.type}
        error={signError}
      />
    </div>
  );
}
