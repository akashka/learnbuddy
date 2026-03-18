import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';

interface Child {
  _id: string;
  name?: string;
  studentId?: string;
}

interface DeleteAccountSectionProps {
  role: 'parent' | 'teacher';
  onDeleted: () => void;
}

const WARNING_TEXT = `
Deleting your data is permanent and cannot be undone.

• All payments made will be lost – no refunds
• You will not be able to log in again
• You will have to start fresh if you want to use the platform again
• All class history, enrollments, and progress will be lost
• For parents: Deleting your account also deletes all your children's data – you cannot retain children while deleting yourself
`.trim();

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

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h2 className="mb-2 font-semibold text-red-800">Delete Account / Data</h2>
      <p className="mb-4 text-sm text-gray-700">
        This action is irreversible. Only parents and teachers can delete their data.
      </p>

      {step === 'idle' && (
        <button
          onClick={() => setStep('confirm')}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-100"
        >
          I want to delete my data
        </button>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <pre className="whitespace-pre-wrap rounded bg-white p-3 text-sm text-gray-700">{WARNING_TEXT}</pre>

          {role === 'parent' && children.length > 0 && (
            <div>
              <p className="mb-2 font-medium text-gray-700">What do you want to delete?</p>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={scope === 'full'}
                  onChange={() => setScope('full')}
                />
                <span>My complete account and all my children&apos;s data</span>
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="radio"
                  checked={scope === 'students'}
                  onChange={() => setScope('students')}
                />
                <span>Only specific children (I will keep my account)</span>
              </label>
              {scope === 'students' && (
                <div className="mt-2 space-y-2 pl-6">
                  {children.map((c) => (
                    <label key={c._id} className="flex items-center gap-2">
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
          <div className="flex gap-2">
            <button
              onClick={handleRequestDelete}
              disabled={
                loading ||
                (scope === 'students' && selectedStudents.length === 0)
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send OTP to my phone'}
            </button>
            <button
              onClick={() => { setStep('idle'); setError(''); }}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
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
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Confirm & Delete'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('confirm'); setOtp(''); setError(''); }}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
