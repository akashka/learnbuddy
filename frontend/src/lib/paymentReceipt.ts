import { formatCurrency } from '@shared/formatters';

export type PaymentReceipt = {
  paymentId: string;
  paidAt: string;
  pendingEnrollmentId: string;
  /** Set after payment completes enrollment */
  enrollmentId?: string;
  studentMongoId?: string;
  studentDisplayId?: string;
  /** Shown on downloadable receipt when set */
  studentName?: string;
  subject?: string;
  teacherName?: string;
  batchName?: string;
  board?: string;
  classLevel?: string;
  duration?: string;
  feePerMonth?: number;
  discount?: number;
  discountCode?: string;
  discountCodeAmount?: number;
  totalAmount?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
};

export function formatEnrollmentDuration(d?: string): string {
  if (!d) return '—';
  const map: Record<string, string> = {
    '3months': '3 months',
    '6months': '6 months',
    '12months': '12 months',
  };
  return map[d] ?? d;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReceiptHtml(receipt: PaymentReceipt, platformName = 'Tuition Platform'): string {
  const rows: [string, string][] = [
    ['Payment ID', receipt.paymentId],
    ['Date', new Date(receipt.paidAt).toLocaleString()],
    ...(receipt.enrollmentId ? ([['Enrollment ID', receipt.enrollmentId]] as [string, string][]) : []),
    ...(receipt.studentDisplayId ? ([['Learner ID', receipt.studentDisplayId]] as [string, string][]) : []),
    ...(receipt.studentName ? ([['Student', receipt.studentName]] as [string, string][]) : []),
    ['Course / Subject', receipt.subject ?? '—'],
    ['Teacher', receipt.teacherName ?? '—'],
    ['Batch', receipt.batchName ?? '—'],
    ['Board', receipt.board ?? '—'],
    ['Class', receipt.classLevel ?? '—'],
    ['Plan', formatEnrollmentDuration(receipt.duration)],
    ['Fee / month', receipt.feePerMonth != null ? formatCurrency(receipt.feePerMonth) : '—'],
  ];
  if (receipt.discount != null && receipt.discount > 0) {
    rows.push(['Discount', `${receipt.discount}%`]);
  }
  if (receipt.discountCode) {
    rows.push(['Promo code', receipt.discountCode]);
  }
  if (receipt.discountCodeAmount != null && receipt.discountCodeAmount > 0) {
    rows.push(['Promo amount', formatCurrency(receipt.discountCodeAmount)]);
  }
  rows.push(['Amount paid', formatCurrency(receipt.totalAmount ?? 0)]);

  const slots =
    receipt.slots && receipt.slots.length > 0
      ? `<p style="margin:16px 0 8px;font-weight:600;">Schedule</p><ul style="margin:0;padding-left:20px;">${receipt.slots
          .map((s) => `<li>${escapeHtml(s.day)} ${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</li>`)
          .join('')}</ul>`
      : '';

  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;width:40%;">${escapeHtml(
          k
        )}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(String(v))}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.paymentId)}</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:24px;color:#111;">
<h1 style="color:#1e3a5f;">Payment receipt</h1>
<p style="color:#6b7280;">${escapeHtml(platformName)}</p>
<p style="color:#6b7280;font-size:14px;">Reference: ${escapeHtml(receipt.pendingEnrollmentId)}</p>
<table style="width:100%;border-collapse:collapse;margin-top:24px;">${body}</table>
${slots}
<p style="margin-top:32px;font-size:12px;color:#9ca3af;">This is a computer-generated receipt for your records.</p>
</body></html>`;
}

export function downloadReceiptFile(receipt: PaymentReceipt, filename?: string) {
  const html = buildReceiptHtml(receipt);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `receipt-${receipt.paymentId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build a receipt from a completed enrollment row returned by GET /api/parent/payments */
export function paymentHistoryToReceipt(p: {
  _id: string;
  paymentId?: string;
  totalAmount?: number;
  subject?: string;
  createdAt?: string;
  updatedAt?: string;
  student?: { name?: string; studentId?: string };
  teacher?: { name?: string };
  batchId?: string;
  board?: string;
  classLevel?: string;
  duration?: string;
  feePerMonth?: number;
  discount?: number;
  discountCode?: string;
  discountCodeAmount?: number;
  slots?: { day: string; startTime: string; endTime: string }[];
}): PaymentReceipt {
  const paidRaw = p.updatedAt || p.createdAt || new Date().toISOString();
  const paidAt = typeof paidRaw === 'string' ? paidRaw : new Date(paidRaw as Date).toISOString();
  return {
    paymentId: p.paymentId || `ref_${String(p._id).slice(-10)}`,
    paidAt,
    pendingEnrollmentId: p._id,
    enrollmentId: p._id,
    studentName: p.student?.name,
    studentDisplayId: p.student?.studentId,
    subject: p.subject,
    teacherName: p.teacher?.name,
    batchName: p.batchId,
    board: p.board,
    classLevel: p.classLevel,
    duration: p.duration,
    feePerMonth: p.feePerMonth,
    discount: p.discount,
    discountCode: p.discountCode,
    discountCodeAmount: p.discountCodeAmount,
    totalAmount: p.totalAmount,
    slots: p.slots,
  };
}

export function downloadPaymentHistoryReceipt(
  p: Parameters<typeof paymentHistoryToReceipt>[0]
) {
  const r = paymentHistoryToReceipt(p);
  downloadReceiptFile(r, `receipt-${r.paymentId}.html`);
}
