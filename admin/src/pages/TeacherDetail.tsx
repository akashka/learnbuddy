import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';

type BgvApprovedBy = { email?: string } | null;

function arrToStr(arr: unknown): string {
  return Array.isArray(arr) ? arr.map(String).filter(Boolean).join(', ') : '';
}

function strToArr(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [bgvLoading, setBgvLoading] = useState(false);
  const [bgvError, setBgvError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi.teachers.get(id)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, [id]);

  const refreshData = () => {
    if (!id) return;
    adminApi.teachers.get(id)
      .then((d) => setData(d as Record<string, unknown>))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'));
  };

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    photoUrl: '',
    qualification: '',
    profession: '',
    languages: '',
    experienceMonths: '',
    bio: '',
    demoVideoUrl: '',
    board: '',
    classes: '',
    subjects: '',
    status: '',
    marketplaceOrder: '',
    commissionPercent: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, unknown>;
    setEditForm({
      name: String(d.name ?? ''),
      phone: String(d.phone ?? ''),
      photoUrl: String(d.photoUrl ?? ''),
      qualification: String(d.qualification ?? ''),
      profession: String(d.profession ?? ''),
      languages: arrToStr(d.languages),
      experienceMonths: d.experienceMonths != null ? String(d.experienceMonths) : '',
      bio: String(d.bio ?? ''),
      demoVideoUrl: String(d.demoVideoUrl ?? ''),
      board: arrToStr(d.board),
      classes: arrToStr(d.classes),
      subjects: arrToStr(d.subjects),
      status: String(d.status ?? ''),
      marketplaceOrder: d.marketplaceOrder != null ? String(d.marketplaceOrder) : '',
      commissionPercent: d.commissionPercent != null ? String(d.commissionPercent) : '10',
      accountNumber: String((d.bankDetails as { accountNumber?: string })?.accountNumber ?? ''),
      ifsc: String((d.bankDetails as { ifsc?: string })?.ifsc ?? ''),
      bankName: String((d.bankDetails as { bankName?: string })?.bankName ?? ''),
    });
  }, [data]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      const exp = editForm.experienceMonths.trim();
      const payload: Record<string, unknown> = {
        name: editForm.name.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        photoUrl: editForm.photoUrl.trim() || undefined,
        qualification: editForm.qualification.trim() || undefined,
        profession: editForm.profession.trim() || undefined,
        experienceMonths: exp ? (parseInt(exp, 10) || undefined) : undefined,
        bio: editForm.bio.trim() || undefined,
        demoVideoUrl: editForm.demoVideoUrl.trim() || undefined,
        status: editForm.status || undefined,
        commissionPercent: editForm.commissionPercent ? parseInt(editForm.commissionPercent, 10) : undefined,
        bankDetails: {
          accountNumber: editForm.accountNumber.trim() || undefined,
          ifsc: editForm.ifsc.trim() || undefined,
          bankName: editForm.bankName.trim() || undefined,
        },
      };
      const langArr = strToArr(editForm.languages);
      if (langArr.length) payload.languages = langArr;
      const boardArr = strToArr(editForm.board);
      if (boardArr.length) payload.board = boardArr;
      const classesArr = strToArr(editForm.classes);
      if (classesArr.length) payload.classes = classesArr;
      const subjectsArr = strToArr(editForm.subjects);
      if (subjectsArr.length) payload.subjects = subjectsArr;
      if (editForm.marketplaceOrder.trim()) {
        const n = parseInt(editForm.marketplaceOrder, 10);
        if (!isNaN(n) && n >= 1) payload.marketplaceOrder = n;
      }
      await adminApi.teachers.update(id, payload);
      refreshData();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveBgv = async () => {
    if (!id) return;
    setBgvLoading(true);
    setBgvError(null);
    try {
      await adminApi.teachers.approveBgv(id);
      toast.success('BGV approved');
      refreshData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to approve BGV';
      setBgvError(msg);
      toast.error(msg);
    } finally {
      setBgvLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Teacher Detail</h1>
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                Edit Teacher
                {(data.bgvVerified as boolean) && (
                  <span className="inline-flex items-center text-blue-600" title="Background verification completed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </h2>
              <p className="mb-4 text-sm text-accent-600">Email: {(data.userId as { email?: string })?.email ?? '-'} (managed via User) · Rating: {data.averageRating != null ? String(data.averageRating) : '-'} ({String(data.reviewCount ?? 0)} reviews)</p>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Basic Info</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Name</label>
                      <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Phone</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Photo URL</label>
                      <input type="text" value={editForm.photoUrl} onChange={(e) => setEditForm((f) => ({ ...f, photoUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Qualification</label>
                      <input type="text" value={editForm.qualification} onChange={(e) => setEditForm((f) => ({ ...f, qualification: e.target.value }))} placeholder="B.Ed, M.Sc, etc." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Profession</label>
                      <input type="text" value={editForm.profession} onChange={(e) => setEditForm((f) => ({ ...f, profession: e.target.value }))} placeholder="Teacher, Engineer, etc." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Languages (comma-separated)</label>
                      <input type="text" value={editForm.languages} onChange={(e) => setEditForm((f) => ({ ...f, languages: e.target.value }))} placeholder="English, Hindi, Marathi" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Experience (months)</label>
                      <input type="number" min={0} value={editForm.experienceMonths} onChange={(e) => setEditForm((f) => ({ ...f, experienceMonths: e.target.value }))} placeholder="24" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-accent-700">Bio</label>
                      <textarea value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-accent-700">Demo Video URL</label>
                      <input type="text" value={editForm.demoVideoUrl} onChange={(e) => setEditForm((f) => ({ ...f, demoVideoUrl: e.target.value }))} placeholder="https://youtube.com/..." className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Teaching</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Board (comma-separated)</label>
                      <input type="text" value={editForm.board} onChange={(e) => setEditForm((f) => ({ ...f, board: e.target.value }))} placeholder="CBSE, ICSE" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Classes (comma-separated)</label>
                      <input type="text" value={editForm.classes} onChange={(e) => setEditForm((f) => ({ ...f, classes: e.target.value }))} placeholder="8, 9, 10" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Subjects (comma-separated)</label>
                      <input type="text" value={editForm.subjects} onChange={(e) => setEditForm((f) => ({ ...f, subjects: e.target.value }))} placeholder="Math, Physics" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Status</label>
                      <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400">
                        <option value="">—</option>
                        <option value="pending">Pending</option>
                        <option value="qualified">Qualified</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Marketplace Order</label>
                      <input type="number" min={1} value={editForm.marketplaceOrder} onChange={(e) => setEditForm((f) => ({ ...f, marketplaceOrder: e.target.value }))} placeholder="1 = first" className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Commission %</label>
                      <input type="number" min={0} max={100} value={editForm.commissionPercent} onChange={(e) => setEditForm((f) => ({ ...f, commissionPercent: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-accent-700">Bank Details</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Account Number</label>
                      <input type="text" value={editForm.accountNumber} onChange={(e) => setEditForm((f) => ({ ...f, accountNumber: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">IFSC</label>
                      <input type="text" value={editForm.ifsc} onChange={(e) => setEditForm((f) => ({ ...f, ifsc: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-accent-700">Bank Name</label>
                      <input type="text" value={editForm.bankName} onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))} className="w-full rounded-lg border border-accent-200 px-3 py-2 focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400" />
                    </div>
                  </div>
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <button type="submit" disabled={saving} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
              {Array.isArray(data.signedAgreements) && (data.signedAgreements as { type: string; signedAt: string }[]).length > 0 && (
                <div className="mt-4 border-t border-accent-100 pt-4 text-sm text-accent-600">
                  <p><strong>Signed agreements:</strong> {(data.signedAgreements as { type: string; signedAt: string }[]).map((a) => `${a.type} (${new Date(a.signedAt).toLocaleDateString()})`).join(', ')}</p>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-accent-200 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                Background Verification
                {(data.bgvVerified as boolean) && (
                  <span
                    className="inline-flex items-center text-blue-600"
                    title="Background verification completed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </h2>
              {(data.bgvVerified as boolean) ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Status:</strong> <span className="text-blue-600">Verified</span></p>
                  <p><strong>Approved by:</strong> {String((data.bgvApprovedBy as BgvApprovedBy)?.email ?? '-')}</p>
                  <p><strong>Approved at:</strong> {data.bgvApprovedAt ? new Date(String(data.bgvApprovedAt)).toLocaleString() : '-'}</p>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-gray-600">Background verification not yet approved.</p>
                  <button
                    type="button"
                    onClick={handleApproveBgv}
                    disabled={bgvLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bgvLoading ? 'Approving...' : 'Approve BGV'}
                  </button>
                  {bgvError && <p className="mt-2 text-sm text-red-600">{bgvError}</p>}
                </div>
              )}
            </div>
            {Array.isArray(data.batchesWithEnrollments) && (data.batchesWithEnrollments as unknown[]).length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold">Batches</h2>
                <div className="space-y-4">
                  {(data.batchesWithEnrollments as { name?: string; subject?: string; enrolledCount?: number; students?: { _id?: string; name?: string; studentId?: string }[] }[]).map((b, i) => (
                    <div key={i} className="rounded-lg border border-accent-100 p-3">
                      <p><strong>{b.name}</strong> - {b.subject} ({b.enrolledCount ?? 0} enrolled)</p>
                      {Array.isArray(b.students) && b.students.length > 0 && (
                        <div className="mt-2 space-y-1 text-sm">
                          {b.students.map((s) => (
                            <p key={s._id ?? s.studentId}>
                              {(s as { _id?: string })._id ? (
                                <Link to={`/students/${(s as { _id?: string })._id}`} className="text-accent-600 hover:underline">
                                  {s.name ?? s.studentId ?? '-'}
                                </Link>
                              ) : (
                                s.name ?? s.studentId ?? '-'
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(data.reviews) && (data.reviews as unknown[]).length > 0 && (
              <div className="rounded-xl border border-accent-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold">Recent Reviews</h2>
                <div className="space-y-2">
                  {(data.reviews as { rating?: number; review?: string; parentName?: string; createdAt?: string }[]).slice(0, 5).map((r, i) => (
                    <div key={i} className="border-b border-accent-100 pb-2 last:border-0">
                      <p className="text-sm">{r.rating}★ - {r.review ?? '-'} (by {r.parentName})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
