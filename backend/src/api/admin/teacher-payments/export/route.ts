import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherPayment } from '@/lib/models/TeacherPayment';
import { getAuthFromRequest } from '@/lib/auth';
import { toCsv, pickFields } from '@/lib/csvExport';

const ALL_FIELDS = [
  { key: '_id', label: 'ID' },
  { key: 'teacherName', label: 'Teacher' },
  { key: 'periodStart', label: 'Period Start' },
  { key: 'periodEnd', label: 'Period End' },
  { key: 'grossAmount', label: 'Gross' },
  { key: 'commissionAmount', label: 'Commission' },
  { key: 'netAmount', label: 'Net' },
  { key: 'status', label: 'Status' },
  { key: 'paidAt', label: 'Paid At' },
  { key: 'createdAt', label: 'Created' },
];

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields') || 'teacherName,periodStart,periodEnd,grossAmount,netAmount,status';
    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
    const teacherId = searchParams.get('teacherId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    await connectDB();

    const query: Record<string, unknown> = {};
    if (teacherId) query.teacherId = teacherId;
    if (status) query.status = status;
    if (year && month) {
      const y = parseInt(year);
      const m = parseInt(month);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59);
      query.periodStart = { $gte: start };
      query.periodEnd = { $lte: end };
    }

    const payments = await TeacherPayment.find(query)
      .populate('teacherId', 'name')
      .sort({ periodStart: -1 })
      .limit(10000)
      .lean();

    const rows = payments.map((p) => {
      const flat = {
        ...p,
        teacherName: ((p as { teacherId?: { name?: string } }).teacherId as { name?: string })?.name ?? '',
        grossAmount: (p as { grossAmount?: number }).grossAmount ?? (p as { amount?: number }).amount ?? 0,
        commissionAmount: (p as { commissionAmount?: number }).commissionAmount ?? 0,
        netAmount: (p as { netAmount?: number }).netAmount ?? (p as { amount?: number }).amount ?? 0,
      };
      return pickFields(flat as Record<string, unknown>, fields);
    });

    const validFields = fields.filter((f) => ALL_FIELDS.some((af) => af.key === f));
    const headers = validFields.length ? validFields : ['teacherName', 'periodStart', 'periodEnd', 'netAmount', 'status'];
    const headerLabels = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f.label]));
    const headerRow = headers.map((h) => headerLabels[h] || h);
    const csv = toCsv([headerRow, ...rows]);

    return NextResponse.body(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="teacher-payments-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Teacher payments export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
