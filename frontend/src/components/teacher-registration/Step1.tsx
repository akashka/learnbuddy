import { useState, useEffect } from 'react';
import { apiJson } from '@/lib/api';
import { LocationSearch } from '@/components/LocationSearch';
import { PolicyTermsCheckbox } from '@/components/PolicyTermsCheckbox';

interface Step1Props {
  phone: string;
  onNext: (step: number, data?: Record<string, unknown>) => void;
  initialData: Record<string, unknown>;
  onSave: (step: number, data: Record<string, unknown>) => Promise<void>;
}

export default function TeacherStep1({ phone, onNext, initialData, onSave }: Step1Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  useEffect(() => {
    const s = initialData as Record<string, string | boolean> | undefined;
    if (s && (s.name || s.email)) {
      setName(String(s.name ?? ''));
      setEmail(String(s.email ?? ''));
      setDateOfBirth(String(s.dateOfBirth ?? ''));
      setAge(String(s.age ?? ''));
      setLocation(String(s.location ?? ''));
      setAcceptedPolicy(!!s.acceptedPolicy);
      return;
    }
    const loadData = async () => {
      try {
        const data = await apiJson<{ data?: { step1?: Record<string, unknown> } }>(
          `/api/teacher-registration/data?phone=${encodeURIComponent(phone)}`
        );
        if (data.data?.step1) {
          const step1 = data.data.step1 as Record<string, string | boolean>;
          setName(String(step1.name ?? ''));
          setEmail(String(step1.email ?? ''));
          setDateOfBirth(String(step1.dateOfBirth ?? ''));
          setAge(String(step1.age ?? ''));
          setLocation(String(step1.location ?? ''));
          setAcceptedPolicy(!!step1.acceptedPolicy);
        }
      } catch {
        // ignore
      }
    };
    loadData();
  }, [phone, initialData]);

  useEffect(() => {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
      setAge(String(a));
    }
  }, [dateOfBirth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedPolicy) {
      setError('Please accept the Privacy Policy and Terms & Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      await onSave(1, {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth || undefined,
        age: age ? parseInt(age) : undefined,
        location: location || undefined,
        acceptedPolicy,
      });
      onNext(2, {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth || undefined,
        age: age ? parseInt(age) : undefined,
        location: location || undefined,
        acceptedPolicy,
      });
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-brand-800">Step 1: Basic Details</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block font-semibold text-brand-800">Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">Phone</label>
          <input type="text" value={phone} readOnly className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold text-brand-800">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={18}
              max={100}
              placeholder="Auto-calculated from DOB"
              className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block font-semibold text-brand-800">Location</label>
          <LocationSearch
            value={location}
            onChange={setLocation}
            label=""
            placeholder="Start typing to search (City, State or area)"
            inputClassName="rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500"
          />
        </div>
        <PolicyTermsCheckbox
          checked={acceptedPolicy}
          onChange={setAcceptedPolicy}
          error={error && !acceptedPolicy ? error : undefined}
        />
        {error && acceptedPolicy && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            <span className="btn-text">{loading ? 'Saving...' : 'Save & Continue'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
