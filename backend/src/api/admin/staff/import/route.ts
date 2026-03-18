import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { User } from '@/lib/models/User';
import { hashPassword, getAuthFromRequest } from '@/lib/auth';

const VALID_ROLES = ['admin', 'sales', 'marketing', 'hr', 'finance'];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let inQuotes = false;
  let cell = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',' || c === '\t') {
        current.push(cell.trim());
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        current.push(cell.trim());
        cell = '';
        if (current.some((x) => x)) rows.push(current);
        current = [];
      } else {
        cell += c;
      }
    }
  }
  if (cell || current.length) {
    current.push(cell.trim());
    if (current.some((x) => x)) rows.push(current);
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const csv = typeof body?.csv === 'string' ? body.csv : '';

    if (!csv.trim()) {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
    }

    const rows = parseCsv(csv);
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV must have header row and at least one data row' }, { status: 400 });
    }

    const header = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, ''));
    const nameIdx = header.findIndex((h) => h === 'name');
    const emailIdx = header.findIndex((h) => h === 'email');
    const phoneIdx = header.findIndex((h) => h === 'phone');
    const roleIdx = header.findIndex((h) => h === 'staffrole' || h === 'role');
    const positionIdx = header.findIndex((h) => h === 'position');
    const departmentIdx = header.findIndex((h) => h === 'department');
    const passwordIdx = header.findIndex((h) => h === 'password');

    if (nameIdx < 0 || emailIdx < 0 || roleIdx < 0) {
      return NextResponse.json({ error: 'CSV must have columns: name, email, staffRole' }, { status: 400 });
    }

    await connectDB();

    const results: { created: number; skipped: string[]; errors: string[] } = { created: 0, skipped: [], errors: [] };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[nameIdx] ?? '').trim();
      const email = (row[emailIdx] ?? '').trim().toLowerCase();
      const phone = (row[phoneIdx] ?? '').trim() || undefined;
      const staffRole = (row[roleIdx] ?? 'sales').trim().toLowerCase();
      const position = positionIdx >= 0 ? (row[positionIdx] ?? '').trim() || undefined : undefined;
      const department = departmentIdx >= 0 ? (row[departmentIdx] ?? '').trim() || undefined : undefined;
      const password = (row[passwordIdx] ?? 'Welcome123').trim();

      if (!name || !email) {
        results.errors.push(`Row ${i + 1}: name and email required`);
        continue;
      }

      if (!VALID_ROLES.includes(staffRole)) {
        results.errors.push(`Row ${i + 1}: invalid staffRole "${staffRole}"`);
        continue;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.skipped.push(`${email} (already exists)`);
        continue;
      }

      const existingStaff = await AdminStaff.findOne({ email });
      if (existingStaff) {
        results.skipped.push(`${email} (staff exists)`);
        continue;
      }

      try {
        const hashedPassword = await hashPassword(password || 'Welcome123');
        const user = await User.create({
          email,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        });

        await AdminStaff.create({
          userId: user._id,
          name,
          email,
          phone,
          staffRole,
          position,
          department,
          isActive: true,
        });
        results.created++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    }

    return NextResponse.json({
      success: true,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors,
    });
  } catch (error) {
    console.error('Staff import error:', error);
    return NextResponse.json({ error: 'Failed to import' }, { status: 500 });
  }
}
