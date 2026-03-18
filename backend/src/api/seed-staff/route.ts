import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { hashPassword } from '@/lib/auth';

const DEFAULT_PASSWORD = 'Welcome123';

const STAFF_SEED = [
  { email: 'admin@example.com', name: 'Super Admin', staffRole: 'admin' as const, phone: '+91 9876543210' },
  { email: 'sales@example.com', name: 'Sales Lead', staffRole: 'sales' as const, phone: '+91 9876543211' },
  { email: 'marketing@example.com', name: 'Marketing Manager', staffRole: 'marketing' as const, phone: '+91 9876543212' },
  { email: 'hr@example.com', name: 'HR Coordinator', staffRole: 'hr' as const, phone: '+91 9876543213' },
  { email: 'finance@example.com', name: 'Finance Analyst', staffRole: 'finance' as const, phone: '+91 9876543214' },
];

/** POST - Seed admin staff (Users + AdminStaff records). No auth required. */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const reset = new URL(request.url).searchParams.get('reset') === '1';
    const setAllActive = new URL(request.url).searchParams.get('setAllActive') === '1';

    if (setAllActive) {
      const result = await AdminStaff.updateMany({}, { $set: { isActive: true } });
      return NextResponse.json({
        message: 'All staff set to active',
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      });
    }

    const created: string[] = [];
    const updated: string[] = [];

    for (const entry of STAFF_SEED) {
      let user = await User.findOne({ email: entry.email });
      if (!user) {
        const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
        user = await User.create({
          email: entry.email,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        });
        created.push(`User: ${entry.email}`);
      } else if (reset) {
        const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
        await User.findByIdAndUpdate(user._id, { $set: { password: hashedPassword } });
      }

      const existingStaff = await AdminStaff.findOne({ userId: user._id });
      if (!existingStaff) {
        await AdminStaff.create({
          userId: user._id,
          name: entry.name,
          email: entry.email,
          phone: entry.phone,
          staffRole: entry.staffRole,
          isActive: true,
        });
        created.push(`Staff: ${entry.name} (${entry.staffRole})`);
      } else {
        await AdminStaff.findByIdAndUpdate(existingStaff._id, {
          $set: { name: entry.name, staffRole: entry.staffRole, phone: entry.phone, isActive: true },
        });
        updated.push(`${entry.name} (${entry.staffRole})`);
      }
    }

    return NextResponse.json({
      message: 'Staff seeded successfully',
      created,
      updated,
      count: STAFF_SEED.length,
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (error) {
    console.error('Seed staff error:', error);
    return NextResponse.json({ error: 'Seed staff failed' }, { status: 500 });
  }
}
