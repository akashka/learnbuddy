import { useState } from 'react';
import { apiJson } from '@/lib/api';
import { ConsentModal } from '@/components/ConsentModal';

interface AddEditStudentFormProps {
  mode: 'add' | 'edit';
  student?: {
    _id: string;
    name?: string;
    dateOfBirth?: string;
    classLevel?: string;
    board?: string;
    schoolName?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddEditStudentForm({ mode, student, onSuccess, onCancel }: AddEditStudentFormProps) {
  const [form, setForm] = useState({
    name: student?.name || '',
    dateOfBirth: student?.dateOfBirth?.slice(0, 10) || '',
    classLevel: student?.classLevel || '',
    board: student?.board || '',
    schoolName: student?.schoolName || '',
    consentDataCollection: false,
    consentAiMonitoring: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentModal, setConsentModal] = useState<'child_data_collection' | 'ai_monitoring' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.consentDataCollection || !form.consentAiMonitoring) {
      setError('Please accept both consent terms');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'add') {
        await apiJson('/api/parent/students/create', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            dateOfBirth: form.dateOfBirth,
            classLevel: form.classLevel,
            board: form.board,
            schoolName: form.schoolName || undefined,
            consentDataCollection: true,
            consentAiMonitoring: true,
          }),
        });
      } else {
        await apiJson('/api/parent/students/update', {
          method: 'PUT',
          body: JSON.stringify({
            studentId: student!._id,
            name: form.name,
            dateOfBirth: form.dateOfBirth,
            classLevel: form.classLevel,
            board: form.board,
            schoolName: form.schoolName || undefined,
            consentDataCollection: true,
            consentAiMonitoring: true,
          }),
        });
      }
      onSuccess();
    } catch (err) {
      setError((err as Error).message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date of birth *</label>
        <input
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Class *</label>
        <input
          type="text"
          value={form.classLevel}
          onChange={(e) => setForm((f) => ({ ...f, classLevel: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="e.g. 8"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Board *</label>
        <input
          type="text"
          value={form.board}
          onChange={(e) => setForm((f) => ({ ...f, board: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="e.g. CBSE, ICSE"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">School name (optional)</label>
        <input
          type="text"
          value={form.schoolName}
          onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="mb-3 text-sm text-gray-700">
          I accept the{' '}
          <button
            type="button"
            onClick={() => setConsentModal('child_data_collection')}
            className="font-medium text-brand-600 underline hover:text-brand-800"
          >
            Child Data Collection
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setConsentModal('ai_monitoring')}
            className="font-medium text-brand-600 underline hover:text-brand-800"
          >
            AI Monitoring
          </button>{' '}
          terms.
        </p>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={form.consentDataCollection}
            onChange={(e) => setForm((f) => ({ ...f, consentDataCollection: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm">Child data collection consent</span>
        </label>
        <label className="mt-2 flex items-start gap-2">
          <input
            type="checkbox"
            checked={form.consentAiMonitoring}
            onChange={(e) => setForm((f) => ({ ...f, consentAiMonitoring: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm">AI monitoring consent</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : mode === 'add' ? 'Add Student' : 'Update'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {consentModal && (
        <ConsentModal
          type={consentModal}
          isOpen={!!consentModal}
          onClose={() => setConsentModal(null)}
        />
      )}
    </form>
  );
}
