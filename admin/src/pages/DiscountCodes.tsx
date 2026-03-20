import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { useToast } from '@/contexts/ToastContext';
import { DataState } from '@/components/DataState';
import { formatCurrency } from '@shared/formatters';

type DiscountCodeDoc = {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableBoards: string[];
  applicableClasses: string[];
  description?: string;
  createdAt: string;
};

export default function DiscountCodes() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<DiscountCodeDoc[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewRedemptionsId, setViewRedemptionsId] = useState<string | null>(null);
  const [redemptionsData, setRedemptionsData] = useState<{ code: DiscountCodeDoc; redemptions: unknown[] } | null>(null);
  const [masters, setMasters] = useState<{ boards: { value: string }[]; classes: { value: string }[] } | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 10,
    minAmount: '',
    maxDiscountAmount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableBoards: [] as string[],
    applicableClasses: [] as string[],
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCodes = () => {
    setLoading(true);
    adminApi.discountCodes.list()
      .then((d) => setCodes((d as { codes: DiscountCodeDoc[] }).codes))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCodes();
    adminApi.masters()
      .then((d) => {
        const data = d as { boards: { value: string }[]; classes: { value: string }[] };
        setMasters({ boards: data.boards ?? [], classes: data.classes ?? [] });
      })
      .catch(() => setMasters({ boards: [], classes: [] }));
  }, []);

  useEffect(() => {
    if (viewRedemptionsId) {
      adminApi.discountCodes.getRedemptions(viewRedemptionsId)
        .then((d) => setRedemptionsData(d as { code: DiscountCodeDoc; redemptions: unknown[] }))
        .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load redemptions'));
    } else {
      setRedemptionsData(null);
    }
  }, [viewRedemptionsId, toast]);

  useEffect(() => {
    if (editingId) {
      adminApi.discountCodes.get(editingId)
        .then((d) => {
          const c = (d as { code: DiscountCodeDoc }).code;
          setForm({
            code: c.code,
            type: c.type,
            value: c.value,
            minAmount: c.minAmount != null ? String(c.minAmount) : '',
            maxUses: c.maxUses != null ? String(c.maxUses) : '',
            validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 16) : '',
            validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 16) : '',
            isActive: c.isActive,
            applicableBoards: c.applicableBoards ?? [],
            applicableClasses: c.applicableClasses ?? [],
            description: c.description ?? '',
          });
        })
        .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load'));
    } else if (!showForm) {
      setForm({
        code: '',
        type: 'percent',
        value: 10,
        minAmount: '',
        maxDiscountAmount: '',
        maxUses: '',
        validFrom: '',
        validUntil: '',
        isActive: true,
        applicableBoards: [],
        applicableClasses: [],
        description: '',
      });
    }
  }, [editingId, showForm, toast]);

  useEffect(() => {
    const boards = masters?.boards ?? [];
    if (boards.length === 1 && form.applicableBoards.length === 0) {
      setForm((f) => ({ ...f, applicableBoards: [boards[0].value] }));
    }
  }, [masters?.boards, form.applicableBoards.length]);
  useEffect(() => {
    const classes = masters?.classes ?? [];
    if (classes.length === 1 && form.applicableClasses.length === 0) {
      setForm((f) => ({ ...f, applicableClasses: [classes[0].value] }));
    }
  }, [masters?.classes, form.applicableClasses.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        isActive: form.isActive,
        applicableBoards: form.applicableBoards,
        applicableClasses: form.applicableClasses,
        description: form.description || undefined,
      };
      if (editingId) {
        await adminApi.discountCodes.update(editingId, payload);
        toast.success('Discount code updated');
      } else {
        await adminApi.discountCodes.create(payload);
        toast.success('Discount code created');
      }
      setShowForm(false);
      setEditingId(null);
      fetchCodes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleBoard = (v: string) => {
    setForm((f) => ({
      ...f,
      applicableBoards: f.applicableBoards.includes(v)
        ? f.applicableBoards.filter((b) => b !== v)
        : [...f.applicableBoards, v],
    }));
  };
  const toggleClass = (v: string) => {
    setForm((f) => ({
      ...f,
      applicableClasses: f.applicableClasses.includes(v)
        ? f.applicableClasses.filter((c) => c !== v)
        : [...f.applicableClasses, v],
    }));
  };

  const now = new Date();
  const isExpired = (doc: DiscountCodeDoc) => new Date(doc.validUntil) < now;
  const isUpcoming = (doc: DiscountCodeDoc) => new Date(doc.validFrom) > now;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-accent-800">Discount Codes</h1>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          Create discount code
        </button>
      </div>

      <DataState loading={loading} error={error} onRetry={fetchCodes}>
        <div className="rounded-lg border border-accent-200 bg-white overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-accent-50">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Value</th>
                <th className="px-4 py-2 text-left">Valid</th>
                <th className="px-4 py-2 text-left">Used</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c._id} className="border-t border-accent-100 hover:bg-accent-50/50">
                  <td className="px-4 py-2 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-2">{c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value)}</td>
                  <td className="px-4 py-2">
                    {c.type === 'percent' ? `${c.value}%` : formatCurrency(c.value)}
                    {c.minAmount != null && <span className="text-gray-500"> (min {formatCurrency(c.minAmount)})</span>}
                    {c.type === 'percent' && c.maxDiscountAmount != null && <span className="text-gray-500"> (max {formatCurrency(c.maxDiscountAmount)})</span>}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(c.validFrom).toLocaleDateString()} – {new Date(c.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {c.usedCount}
                    {c.maxUses != null && <span className="text-gray-500"> / {c.maxUses}</span>}
                  </td>
                  <td className="px-4 py-2">
                    {!c.isActive && <span className="text-gray-500">Inactive</span>}
                    {c.isActive && isExpired(c) && <span className="text-amber-600">Expired</span>}
                    {c.isActive && isUpcoming(c) && <span className="text-blue-600">Upcoming</span>}
                    {c.isActive && !isExpired(c) && !isUpcoming(c) && <span className="text-green-600">Active</span>}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => { setEditingId(c._id); setShowForm(true); }}
                      className="text-accent-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewRedemptionsId(c._id)}
                      className="text-accent-600 hover:underline"
                    >
                      View redemptions ({c.usedCount})
                    </button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">No discount codes yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DataState>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="max-w-xl w-full overflow-hidden rounded-2xl border border-accent-200 bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold text-accent-800">
              {editingId ? 'Edit discount code' : 'Create discount code'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER20"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2 font-mono"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Value *</label>
                  <input
                    type="number"
                    min={0}
                    max={form.type === 'percent' ? 100 : undefined}
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Min amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.minAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                {form.type === 'percent' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-accent-700">Max discount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.maxDiscountAmount}
                      onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                      placeholder="Cap for % codes"
                      className="w-full rounded-lg border border-accent-200 px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Max uses</label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Valid from</label>
                  <input
                    type="datetime-local"
                    value={form.validFrom}
                    onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-accent-700">Valid until</label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                    className="w-full rounded-lg border border-accent-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Applicable boards</label>
                <p className="mb-2 text-xs text-gray-500">Leave empty for all boards</p>
                <div className="flex flex-wrap gap-2">
                  {(masters?.boards ?? []).map((b) => (
                    <label key={b.value} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={form.applicableBoards.includes(b.value)}
                        onChange={() => toggleBoard(b.value)}
                      />
                      <span>{b.value}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Applicable classes</label>
                <p className="mb-2 text-xs text-gray-500">Leave empty for all classes</p>
                <div className="flex flex-wrap gap-2">
                  {(masters?.classes ?? []).map((c) => (
                    <label key={c.value} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={form.applicableClasses.includes(c.value)}
                        onChange={() => toggleClass(c.value)}
                      />
                      <span>{c.value}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-accent-700">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-accent-200 px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <span>Active</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-lg border border-accent-200 px-4 py-2 text-sm hover:bg-accent-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewRedemptionsId && redemptionsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewRedemptionsId(null)}>
          <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border border-accent-200 bg-white shadow-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-accent-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-accent-800">
                Redemptions: {redemptionsData.code.code}
              </h2>
              <button
                type="button"
                onClick={() => setViewRedemptionsId(null)}
                className="rounded-lg border border-accent-200 px-3 py-1 text-sm hover:bg-accent-50"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {redemptionsData.redemptions.length === 0 ? (
                <p className="text-gray-500">No redemptions yet</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-accent-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Parent</th>
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Teacher</th>
                      <th className="px-4 py-2 text-left">Course</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Discount</th>
                      <th className="px-4 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(redemptionsData.redemptions as Record<string, unknown>[]).map((r, i) => (
                      <tr key={i} className="border-t border-accent-100">
                        <td className="px-4 py-2">
                          <div>{String(r.parentName ?? '-')}</div>
                          {r.parentPhone && <div className="text-xs text-gray-500">{String(r.parentPhone)}</div>}
                        </td>
                        <td className="px-4 py-2">
                          {String(r.studentName ?? '-')}
                          {r.studentId && <span className="text-xs text-gray-500"> ({String(r.studentId)})</span>}
                        </td>
                        <td className="px-4 py-2">{String(r.teacherName ?? '-')}</td>
                        <td className="px-4 py-2">
                          {String(r.subject ?? '-')} • {String(r.board ?? '-')} Class {String(r.classLevel ?? '-')}
                        </td>
<td className="px-4 py-2">{r.totalAmount != null ? formatCurrency(r.totalAmount) : '-'}</td>
                    <td className="px-4 py-2 text-green-600">-{r.discountCodeAmount != null ? formatCurrency(r.discountCodeAmount) : formatCurrency(0)}</td>
                        <td className="px-4 py-2">
                          {r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
