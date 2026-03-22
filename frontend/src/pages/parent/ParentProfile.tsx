import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '@/components/Modal';
import { apiJson } from '@/lib/api';
import { formatPhone } from '@shared/formatters';
import { PageHeader } from '@/components/PageHeader';
import { ContentCard } from '@/components/ContentCard';
import { InlineErrorDisplay } from '@/components/InlineErrorDisplay';
import { LocationSearch } from '@/components/LocationSearch';

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const PHOTO_MAX_MB = 2;
const PHOTO_MAX_BYTES = PHOTO_MAX_MB * 1024 * 1024;

interface Profile {
  name?: string;
  email?: string;
  emailVerifiedAt?: string;
  phone?: string;
  location?: string;
  photoUrl?: string;
}

export default function ParentProfile() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', location: '', photoUrl: '' });
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(() => {
    setError(null);
    setLoading(true);
    apiJson<Profile>('/api/parent/profile')
      .then((p) => {
        setProfile(p);
        setForm({ name: p.name || '', email: p.email || '', location: p.location || '', photoUrl: p.photoUrl || '' });
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
      await apiJson('/api/parent/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          email: form.email.trim() || undefined,
          location: form.location.trim() || undefined,
          photoUrl: form.photoUrl.trim() || undefined,
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

  const handleCancel = () => {
    if (profile) {
      setForm({ name: profile.name || '', email: profile.email || '', location: profile.location || '', photoUrl: profile.photoUrl || '' });
    }
    setEditing(false);
    setError(null);
    setPhotoError(null);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setPhotoError(null);
    if (!file) return;
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError(`Image must be under ${PHOTO_MAX_MB}MB`);
      return;
    }
    if (!PHOTO_ACCEPT.split(',').includes(file.type)) {
      setPhotoError('Please use JPG, PNG or WebP');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSendVerification = async () => {
    setSendingVerify(true);
    setError(null);
    try {
      await apiJson<{ devLink?: string }>('/api/auth/send-email-verification', { method: 'POST' });
      setVerifyModalOpen(true);
      if (profile?.email) fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    );
  }
  if (error && !profile) return <InlineErrorDisplay error={error} onRetry={fetchProfile} fullPage />;

  const emailVerified = !!profile?.emailVerifiedAt;

  return (
    <div className="w-full animate-fade-in">
      <PageHeader
        icon="👤"
        title="Profile"
        subtitle="Your account details"
        action={
          !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PHOTO_ACCEPT}
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                {editing ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-200 bg-brand-50 shadow-md transition hover:border-brand-400 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    {form.photoUrl || profile?.photoUrl ? (
                      <>
                        <img src={form.photoUrl || profile?.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                          <span className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-brand-800">Change photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brand-400">
                        <span className="text-4xl">👨‍👩‍👧‍👦</span>
                        <span className="text-xs font-medium">Click to upload</span>
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-200 bg-brand-50 shadow-md">
                    {profile?.photoUrl ? (
                      <img src={profile.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl text-brand-400">👨‍👩‍👧‍👦</div>
                    )}
                  </div>
                )}
                {editing && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">JPG, PNG or WebP, max {PHOTO_MAX_MB}MB</p>
                    {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
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
                        placeholder="Your name"
                        className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border-2 border-brand-200 px-4 py-3 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                      <p className="mt-1 text-xs text-gray-500">Changing email will require re-verification</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={formatPhone(profile?.phone)}
                        disabled
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Phone cannot be changed</p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
                      <LocationSearch
                        value={form.location}
                        onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                        label=""
                        placeholder="Start typing to search (City, State or area)"
                        inputClassName="rounded-xl border-2 border-brand-200 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{String(error)}</p>}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:from-brand-600 hover:to-brand-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-xl border-2 border-brand-200 px-4 py-2.5 font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
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
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-brand-800">{profile?.email || '-'}</p>
                        {emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <span aria-hidden>✓</span> Verified
                          </span>
                        ) : profile?.email ? (
                          <button
                            type="button"
                            onClick={handleSendVerification}
                            disabled={sendingVerify}
                            className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-60"
                          >
                            {sendingVerify ? 'Sending...' : 'Verify email'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-brand-800">{formatPhone(profile?.phone) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-brand-800">{profile?.location || '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ContentCard>
      </div>

      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} maxWidth="max-w-md">
        <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white">Email verification</h3>
          </div>
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 text-2xl">
                ✉️
              </div>
              <p className="text-brand-800">
                A confirmation email has been sent to your inbox. Please check your email and click the verification link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVerifyModalOpen(false)}
              className="btn-primary w-full"
            >
              <span className="btn-text">Got it</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
