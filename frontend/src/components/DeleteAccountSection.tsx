import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';
import { Modal } from '@/components/Modal';

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
}

interface DeleteAccountSectionProps {
  role: 'parent' | 'teacher';
  onDeleted: () => void;
}

const WARNING_ITEMS = [
  'Deleting your data is permanent and cannot be undone.',
  'All payments made will be lost – no refunds',
  'You will not be able to log in again',
  'You will have to start fresh if you want to use the platform again',
  'All class history, enrollments, and progress will be lost',
  "For parents: Deleting your account also deletes all your children's data – you cannot retain children while deleting yourself",
];

export function DeleteAccountSection({ role, onDeleted }: DeleteAccountSectionProps) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [scope, setScope] = useState<'full' | 'students'>('full');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'parent' && step === 'confirm') {
      apiJson<{ children: Child[] }>('/api/parent/students')
        .then((r) => setChildren(r.children || []))
        .catch(() => setChildren([]));
    }
  }, [role, step]);

  useEffect(() => {
    if (scope === 'students' && children.length === 1 && selectedStudents.length === 0) {
      setSelectedStudents([children[0]._id]);
    }
  }, [scope, children, selectedStudents.length]);

  const closeModal = () => {
    setStep('idle');
    setError('');
    setOtp('');
  };

  const handleRequestDelete = async () => {
    setError('');
    setLoading(true);
    try {
      const body = scope === 'students' && selectedStudents.length > 0
        ? { scope: 'students', studentIds: selectedStudents }
        : { scope: 'full' };
      const res = await apiJson<{ devOtp?: string }>('/api/account/delete-request', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.devOtp) {
        window.alert(`OTP (dev): ${res.devOtp}`);
      }
      setStep('otp');
    } catch (err) {
      setError((err as Error).message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiJson('/api/account/delete-confirm', {
        method: 'POST',
        body: JSON.stringify({ otp: otp.trim() }),
      });
      onDeleted();
    } catch (err) {
      setError((err as Error).message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const modalContent = (
    <div className="max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-red-200 bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">
            ⚠️
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Delete Account & Data</h3>
            <p className="text-sm text-red-700/80">This action is irreversible</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeModal}
          className="rounded-lg p-2 text-gray-500 hover:bg-red-100 hover:text-red-700"
          aria-label="Close"
        >
          <span className="text-xl">×</span>
        </button>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-xl border-2 border-red-100 bg-red-50/50 p-4">
          <p className="mb-3 font-semibold text-red-800">Please read carefully:</p>
          <ul className="space-y-2 text-sm text-red-900/90">
            {WARNING_ITEMS.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {step === 'confirm' && (
          <>
            {role === 'parent' && children.length > 0 && (
              <div className="rounded-xl border border-red-100 bg-white p-4">
                <p className="mb-3 font-semibold text-gray-800">What do you want to delete?</p>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-red-50/50">
                  <input
                    type="radio"
                    checked={scope === 'full'}
                    onChange={() => setScope('full')}
                    className="mt-1"
                  />
                  <span className="text-gray-700">My complete account and all my children&apos;s data</span>
                </label>
                <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-red-50/50">
                  <input
                    type="radio"
                    checked={scope === 'students'}
                    onChange={() => setScope('students')}
                    className="mt-1"
                  />
                  <span className="text-gray-700">Only specific children (I will keep my account)</span>
                </label>
                {scope === 'students' && (
                  <div className="mt-3 space-y-2 border-t border-red-100 pt-3 pl-6">
                    {children.map((c) => (
                      <label key={c._id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(c._id)}
                          onChange={() => toggleStudent(c._id)}
                        />
                        <span>{c.name || c.studentId}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleRequestDelete}
                disabled={
                  loading ||
                  (scope === 'students' && selectedStudents.length === 0)
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP to my phone'}
              </button>
              <button
                onClick={closeModal}
                className="rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <p className="text-sm text-gray-700">
              Enter the 6-digit OTP sent to your registered phone number.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-center text-lg tracking-widest focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Confirm & Delete'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('confirm'); setOtp(''); setError(''); }}
                className="rounded-xl border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h2 className="mb-2 font-semibold text-red-800">Delete Account / Data</h2>
      <p className="mb-4 text-sm text-gray-700">
        This action is irreversible. Only parents and teachers can delete their data.
      </p>

      <button
        onClick={() => setStep('confirm')}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-100"
      >
        I want to delete my data
      </button>

      <Modal
        isOpen={step === 'confirm' || step === 'otp'}
        onClose={closeModal}
        overlayClassName="bg-black/60 backdrop-blur-sm"
      >
        {modalContent}
      </Modal>
    </div>
  );
}
