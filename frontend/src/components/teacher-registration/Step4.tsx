import { useState, useEffect, useCallback } from 'react';
import { apiJson } from '@/lib/api';
import { formatBytes } from '@shared/formatters';

const DOCUMENT_TYPES = [
  { value: 'id_proof', label: 'ID Proof (Aadhaar/Passport)' },
  { value: 'educational_certificate', label: 'Educational Certificate' },
  { value: 'degree', label: 'Degree/Diploma' },
  { value: 'other', label: 'Other' },
];

const ACCEPTED_FORMATS = '.pdf,.jpg,.jpeg,.png';
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DOCUMENTS = 5;

export interface DocumentEntry {
  type: string;
  url: string;
  fileName?: string;
}

interface Step4Props {
  phone: string;
  onNext: (step: number, data?: Record<string, unknown>) => void;
  onBack: () => void;
  initialData: Record<string, unknown>;
  onSave: (step: number, data: Record<string, unknown>) => Promise<void>;
}

export default function TeacherStep4({ phone, onNext, onBack, onSave, initialData }: Step4Props) {
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const loadFromData = useCallback((s4: Record<string, unknown>) => {
    const b = s4.bankDetails as { accountNumber?: string; ifsc?: string; bankName?: string } | undefined;
    if (b) {
      setAccountNumber(b.accountNumber || '');
      setIfsc(b.ifsc || '');
      setBankName(b.bankName || '');
    }
    const docs = s4.documents as Array<{ type?: string; url?: string; name?: string }> | undefined;
    if (Array.isArray(docs) && docs.length > 0) {
      setDocuments(
        docs.map((d) => ({
          type: d.type || d.name || 'other',
          url: d.url || '',
          fileName: d.url?.startsWith('data:') ? 'Uploaded file' : undefined,
        }))
      );
    }
  }, []);

  const loadData = useCallback(async () => {
    const data = await apiJson<{ data?: { step4?: Record<string, unknown> } }>(
      `/api/teacher-registration/data?phone=${encodeURIComponent(phone)}`
    );
    if (data.data?.step4) {
      loadFromData(data.data.step4);
    }
  }, [phone, loadFromData]);

  useEffect(() => {
    const s4 = initialData as Record<string, unknown> | undefined;
    if (s4 && (s4.bankDetails || (Array.isArray(s4.documents) && s4.documents.length > 0))) {
      loadFromData(s4);
      return;
    }
    loadData();
  }, [phone, initialData, loadFromData, loadData]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size must be under ${MAX_FILE_SIZE_MB}MB. Your file is ${formatBytes(file.size)}.`;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid format. Allowed: PDF, JPG, PNG.';
    }
    return null;
  };

  const addDocument = (type: string, file: File) => {
    setDocError(null);
    const err = validateFile(file);
    if (err) {
      setDocError(err);
      return;
    }
    if (documents.length >= MAX_DOCUMENTS) {
      setDocError(`Maximum ${MAX_DOCUMENTS} documents allowed.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDocuments((prev) => [...prev, { type, url: dataUrl, fileName: file.name }]);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    setDocError(null);
  };

  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addDocument(type, file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent, skip: boolean) => {
    e.preventDefault();
    setLoading(true);
    setDocError(null);
    try {
      const payload = skip
        ? {}
        : {
            bankDetails: { accountNumber, ifsc, bankName },
            documents: documents.map((d) => ({ type: d.type, url: d.url })),
          };
      await onSave(4, payload);
      onNext(5);
    } catch {
      setDocError('Failed to save. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = async () => {
    setLoading(true);
    setDocError(null);
    try {
      const payload = {
        bankDetails: { accountNumber, ifsc, bankName },
        documents: documents.map((d) => ({ type: d.type, url: d.url })),
      };
      await onSave(4, payload);
      onBack();
    } catch {
      setDocError('Failed to save. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border-2 border-brand-200 bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-brand-800">Step 4: Documents & Banking</h2>
      <p className="mb-6 text-base text-brand-600">
        Upload your documents and add banking details. You can skip and update later from your profile.
      </p>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div>
          <h3 className="mb-3 font-semibold text-brand-800">Documents</h3>
          <p className="mb-3 text-sm text-gray-600">
            Accepted: PDF, JPG, PNG. Max {MAX_FILE_SIZE_MB}MB per file. Up to {MAX_DOCUMENTS} documents.
          </p>
          {documents.map((doc, idx) => (
            <div key={idx} className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-brand-100 bg-brand-50/50 p-3">
              <span className="rounded bg-brand-200 px-2 py-1 text-sm font-medium text-brand-800">
                {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
              </span>
              <span className="truncate text-sm text-gray-600">{doc.fileName || 'Uploaded'}</span>
              <button type="button" onClick={() => removeDocument(idx)} className="ml-auto rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200">
                Remove
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {DOCUMENT_TYPES.map((dt) => (
              <label
                key={dt.value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
              >
                <span>+ Add {dt.label}</span>
                <input type="file" accept={ACCEPTED_FORMATS} className="hidden" onChange={(e) => handleFileChange(dt.value, e)} />
              </label>
            ))}
          </div>
          {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-brand-800">Banking Details</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-semibold">Bank Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account number"
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold">IFSC Code</label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="IFSC"
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank name"
                className="w-full rounded-xl border-2 border-brand-200 px-4 py-3"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={handleBack} disabled={loading} className="btn-secondary">
            <span className="btn-text">Back</span>
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            <span className="btn-text">{loading ? 'Saving...' : 'Save & Continue'}</span>
          </button>
          <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)} disabled={loading} className="btn-secondary">
            <span className="btn-text">Skip for Now</span>
          </button>
        </div>
      </form>
    </div>
  );
}
