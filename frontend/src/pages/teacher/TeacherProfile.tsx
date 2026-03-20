import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { apiJson } from '@/lib/api';
import { formatPhone, formatBytes, formatDateTime } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';

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

function AddDocumentForm({
  onAddByFile,
  onAddByUrl,
  docError,
  saving = false,
}: {
  onAddByFile: (type: string, file: File) => void;
  onAddByUrl: (type: string, url: string) => void;
  docError: string | null;
  saving?: boolean;
}) {
  const [selectedType, setSelectedType] = useState('id_proof');
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddByFile(type, file);
    e.target.value = '';
  };

  const handleAddUrl = () => {
    onAddByUrl(selectedType, urlInput);
    setUrlInput('');
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-4">
      <p className="mb-3 text-sm font-medium text-brand-800">Add document</p>
      <div className={`flex flex-wrap gap-2 ${saving ? 'pointer-events-none opacity-60' : ''}`}>
        {DOCUMENT_TYPES.map((dt) => (
          <label
            key={dt.value}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
          >
            <span>+ Upload {dt.label}</span>
            <input
              type="file"
              accept={ACCEPTED_FORMATS}
              className="hidden"
              onChange={(e) => handleFileChange(dt.value, e)}
              disabled={saving}
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-lg border border-brand-200 px-3 py-2 text-sm"
        >
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Or paste document URL (https://...)"
          className="min-w-[200px] flex-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim() || saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add by URL'}
        </button>
      </div>
      {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
    </div>
  );
}

interface DocWithMeta {
  name: string;
  url: string;
  verified?: boolean;
  uploadedAt?: string;
}

function DocumentViewModal({
  doc,
  onClose,
}: {
  doc: DocWithMeta;
  onClose: () => void;
}) {
  const isImage = doc.url.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(doc.url);
  const isPdf = doc.url.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(doc.url);

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-brand-50 to-white px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-800">{doc.name}</h3>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
              <span>Uploaded: {formatDateTime(doc.uploadedAt)}</span>
              {doc.verified != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {doc.verified ? 'Verified' : 'Pending verification'}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isImage ? (
            <img
              src={doc.url}
              alt={doc.name}
              className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain shadow-lg"
            />
          ) : isPdf ? (
            <iframe
              src={doc.url}
              title={doc.name}
              className="mx-auto h-[70vh] w-full max-w-xl rounded-lg border-0 bg-white shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <p className="text-gray-600">Preview not available for this file type.</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface Profile {
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  qualification?: string;
  profession?: string;
  languages?: string[];
  experienceMonths?: number;
  bio?: string;
  bankDetails?: { accountNumber?: string; ifsc?: string; bankName?: string };
  demoVideoUrl?: string;
  documents?: DocWithMeta[];
}

const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Gujarati',
  'Other',
];

function formatExperience(months?: number): string {
  if (months == null || months === 0) return '-';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${rem} month${rem === 1 ? '' : 's'}`;
}

export default function TeacherProfile() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    photoUrl: '',
    qualification: '',
    profession: '',
    selectedLanguages: [] as string[],
    experienceMonths: '',
    bio: '',
    demoVideoUrl: '',
    documents: [] as DocWithMeta[],
  });
  const [docError, setDocError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocWithMeta | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  const fetchProfile = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Profile>('/api/teacher/profile')
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.name || '',
          photoUrl: p.photoUrl || '',
          qualification: p.qualification || '',
          profession: p.profession || '',
          selectedLanguages: p.languages || [],
          experienceMonths: p.experienceMonths != null ? String(p.experienceMonths) : '',
          bio: p.bio || '',
          demoVideoUrl: p.demoVideoUrl || '',
          documents: p.documents || [],
        });
      })
      .catch((e) => setError(e instanceof Error ? e : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (searchParams.get('edit') === '1') setEditing(true);
  }, [searchParams]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const experienceMonths = form.experienceMonths.trim()
        ? parseInt(form.experienceMonths, 10)
        : undefined;
      if (experienceMonths !== undefined && (isNaN(experienceMonths) || experienceMonths < 0)) {
        setError('Experience must be a valid number of months');
        setSaving(false);
        return;
      }
      await apiJson('/api/teacher/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          photoUrl: form.photoUrl.trim() || undefined,
          qualification: form.qualification.trim() || undefined,
          profession: form.profession.trim() || undefined,
          languages: form.selectedLanguages.length ? form.selectedLanguages : undefined,
          experienceMonths,
          bio: form.bio.trim() || undefined,
          demoVideoUrl: form.demoVideoUrl.trim() || undefined,
          documents: form.documents,
        }),
      });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File must be under ${MAX_FILE_SIZE_MB}MB. Your file is ${formatBytes(file.size)}.`;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid format. Allowed: PDF, JPG, PNG.';
    }
    return null;
  };

  const currentDocuments = editing ? form.documents : (profile?.documents || []);

  const saveDocuments = async (docs: DocWithMeta[]) => {
    setSavingDoc(true);
    setDocError(null);
    try {
      await apiJson('/api/teacher/profile', {
        method: 'PUT',
        body: JSON.stringify({ documents: docs }),
      });
      fetchProfile();
    } catch (err) {
      setDocError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingDoc(false);
    }
  };

  const addDocumentByFile = (type: string, file: File) => {
    setDocError(null);
    const err = validateFile(file);
    if (err) {
      setDocError(err);
      return;
    }
    if (currentDocuments.length >= MAX_DOCUMENTS) {
      setDocError(`Maximum ${MAX_DOCUMENTS} documents allowed.`);
      return;
    }
    const label = DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newDoc: DocWithMeta = {
        name: label,
        url: dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      if (editing) {
        setForm((f) => ({ ...f, documents: [...f.documents, newDoc] }));
      } else {
        saveDocuments([...(profile?.documents || []), newDoc]);
      }
    };
    reader.readAsDataURL(file);
  };

  const addDocumentByUrl = (type: string, url: string) => {
    setDocError(null);
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setDocError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    if (currentDocuments.length >= MAX_DOCUMENTS) {
      setDocError(`Maximum ${MAX_DOCUMENTS} documents allowed.`);
      return;
    }
    const label = DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
    const newDoc: DocWithMeta = {
      name: label,
      url: trimmed,
      uploadedAt: new Date().toISOString(),
    };
    if (editing) {
      setForm((f) => ({ ...f, documents: [...f.documents, newDoc] }));
    } else {
      saveDocuments([...(profile?.documents || []), newDoc]);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        photoUrl: profile.photoUrl || '',
        qualification: profile.qualification || '',
        profession: profile.profession || '',
        selectedLanguages: profile.languages || [],
        experienceMonths: profile.experienceMonths != null ? String(profile.experienceMonths) : '',
        bio: profile.bio || '',
        demoVideoUrl: profile.demoVideoUrl || '',
        documents: profile.documents || [],
      });
    }
    setDocError(null);
    setEditing(false);
    setError(null);
  };

  if (loading) return <div className="text-brand-600">Loading...</div>;
  if (error && !profile) return <InlineErrorDisplay error={error} onRetry={fetchProfile} fullPage />;

  const documents = currentDocuments;

  return (
    <div>
      <PageHeader
        icon="👤"
        title="Profile"
        subtitle="Your complete profile details"
        action={
          !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/30"
            >
              Edit profile
            </button>
          ) : null
        }
      />

      <div className="space-y-6">
        <ContentCard>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 sm:shrink-0">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-200 bg-brand-50 shadow-md">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl text-brand-400">
                      👤
                    </div>
                  )}
                </div>
                {editing && (
                  <div className="w-full max-w-xs">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      value={form.photoUrl}
                      onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>

              {/* Form / View */}
              <div className="min-w-0 flex-1">
                {editing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formatPhone(profile?.phone)}
                          disabled
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">Phone cannot be changed</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Qualification
                        </label>
                        <input
                          type="text"
                          value={form.qualification}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, qualification: e.target.value }))
                          }
                          placeholder="e.g. B.Ed, M.Sc"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={form.profession}
                          onChange={(e) => setForm((f) => ({ ...f, profession: e.target.value }))}
                          placeholder="e.g. Teacher, Engineer"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Experience (months)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.experienceMonths}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, experienceMonths: e.target.value }))
                        }
                        placeholder="e.g. 24"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Total teaching experience in months
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Languages
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => {
                          const selected = form.selectedLanguages.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  selectedLanguages: selected
                                    ? f.selectedLanguages.filter((l) => l !== lang)
                                    : [...f.selectedLanguages, lang],
                                }))
                              }
                              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                selected
                                  ? 'bg-brand-600 text-white shadow-md'
                                  : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                              }`}
                            >
                              {lang}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Click to select languages you can teach in
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        About you
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder="Brief bio for parents..."
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Demo video URL
                      </label>
                      <input
                        type="url"
                        value={form.demoVideoUrl}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, demoVideoUrl: e.target.value }))
                        }
                        placeholder="https://youtube.com/... or direct video link"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Link to your intro or teaching demo video
                      </p>
                    </div>
                    {error && (
                      <p className="text-sm text-red-600">{String(error)}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-brand-800">{profile?.name || '-'}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-brand-800">{profile?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-brand-800">{formatPhone(profile?.phone)}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Qualification</p>
                        <p className="text-brand-800">{profile?.qualification || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Profession</p>
                        <p className="text-brand-800">{profile?.profession || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="text-brand-800">
                        {formatExperience(profile?.experienceMonths)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-sm text-gray-500">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {(profile?.languages || []).length ? (
                          (profile?.languages || []).map((lang) => (
                            <span
                              key={lang}
                              className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700"
                            >
                              {lang}
                            </span>
                          ))
                        ) : (
                          <span className="text-brand-800">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">About you</p>
                      <p className="text-brand-800 whitespace-pre-wrap">
                        {profile?.bio || '-'}
                      </p>
                    </div>
                    {profile?.demoVideoUrl && (
                      <div>
                        <p className="text-sm text-gray-500">Demo video</p>
                        <a
                          href={profile.demoVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          Watch demo video →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Documents */}
        <ContentCard>
          <div className="p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-brand-800">Documents</h2>
            <p className="mb-4 text-sm text-gray-600">
              ID proofs and other documents. PDF, JPG, PNG. Max {MAX_FILE_SIZE_MB}MB per file. Up to{' '}
              {MAX_DOCUMENTS} documents.
            </p>
            <ul className="mb-4 space-y-3">
              {documents.map((doc, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-3"
                >
                  <span className="font-medium text-brand-800">{doc.name}</span>
                  <div className="flex items-center gap-3">
                    {doc.verified != null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          doc.verified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {doc.verified ? 'Verified' : 'Pending'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="rounded-lg bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-200"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {documents.length < MAX_DOCUMENTS && (
              <AddDocumentForm
                onAddByFile={addDocumentByFile}
                onAddByUrl={addDocumentByUrl}
                docError={docError}
                saving={savingDoc}
              />
            )}
          </div>
        </ContentCard>
      </div>

      {viewingDoc && (
        <DocumentViewModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
