import { useState } from 'react';
import { Modal } from '@/components/Modal';

interface StudentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  loginId: string;
  password: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="rounded-xl border border-brand-100 bg-white/90 p-4 shadow-inner">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-brand-50 px-3 py-2 font-mono text-sm font-semibold text-brand-900">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function StudentCredentialsModal({
  isOpen,
  onClose,
  studentName,
  loginId,
  password,
}: StudentCredentialsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white">Learner login details</h2>
          <p className="mt-1 text-sm text-white/90">
            Save these — <strong>{studentName}</strong> will use them to sign in as a student.
          </p>
        </div>
        <div className="space-y-4 px-6 py-6">
          <p className="text-sm text-gray-600">
            Username is the learner ID. Password is the learner ID plus their year of birth (same as shown below).
          </p>
          <CopyRow label="Learner ID (username)" value={loginId} />
          <CopyRow label="Password" value={password} />
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950">
            Store this somewhere safe. For security we don&apos;t email passwords. You can always see the password again on
            My kids using show/copy.
          </div>
        </div>
        <div className="border-t border-brand-100 bg-brand-50/50 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
