import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Batch {
  _id?: string;
  name?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  feePerMonth?: number;
  slots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
}

interface Response {
  batches: Batch[];
}

export default function TeacherBatches() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    apiJson<Response>('/api/teacher/batches')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const batches = data?.batches || [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Batches</h1>
      <div className="space-y-4">
        {batches.map((b, i) => (
          <div key={b._id || i} className="rounded-xl border border-brand-200 bg-white p-4">
            <h3 className="font-semibold text-brand-800">{b.name || 'Batch'}</h3>
            <p className="text-sm text-gray-600">
              {b.board} • {b.classLevel} • {b.subject}
            </p>
            <p className="text-sm">{t('fee')}: ₹{b.feePerMonth}/month</p>
            {b.slots && b.slots.length > 0 && (
              <p className="text-sm">
                Slots: {b.slots.map((s) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
      {batches.length === 0 && <p className="text-gray-600">No batches yet.</p>}
    </div>
  );
}
