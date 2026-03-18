import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

/** GET - Current admin staff profile (for RBAC, display name, etc.) */
export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const staff = await AdminStaff.findOne({ userId: decoded.userId })
      .select('name email phone staffRole isActive photo')
      .lean();

    if (!staff) {
      const user = await User.findById(decoded.userId).select('email').lean();
      return NextResponse.json({
        staffRole: 'admin',
        name: null,
        email: (user as { email?: string })?.email ?? null,
        phone: null,
        isActive: true,
        hasStaffRecord: false,
      });
    }

    return NextResponse.json({
      staffRole: (staff as { staffRole?: string }).staffRole ?? 'admin',
      name: (staff as { name?: string }).name,
      email: (staff as { email?: string }).email,
      phone: (staff as { phone?: string }).phone,
      isActive: (staff as { isActive?: boolean }).isActive,
      photo: (staff as { photo?: string }).photo,
      hasStaffRecord: true,
    });
  } catch (error) {
    console.error('Admin me error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/** PATCH - Update current admin's own profile (name, phone only; staffRole/isActive are admin-only) */
export async function PATCH(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const staff = await AdminStaff.findOne({ userId: decoded.userId });
    if (!staff) {
      return NextResponse.json(
        { error: 'Profile not found. Contact an admin to add you to staff.' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as any;
    const { name, phone, photo } = body;

    const update: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    if (name !== undefined) update.name = String(name).trim() || staff.name;
    if (phone !== undefined) update.phone = phone != null ? String(phone).trim() || undefined : staff.phone;
    if (photo !== undefined) {
      if (photo != null && String(photo).trim()) {
        update.photo = String(photo).trim();
      } else {
        unset.photo = 1;
      }
    }

    const updateOp: Record<string, unknown> = {};
    if (Object.keys(update).length) updateOp.$set = update;
    if (Object.keys(unset).length) updateOp.$unset = unset;
    if (Object.keys(updateOp).length) {
      await AdminStaff.findByIdAndUpdate(staff._id, updateOp);
    }

    const updated = await AdminStaff.findById(staff._id)
      .select('name email phone staffRole isActive photo')
      .lean();

    return NextResponse.json({
      staffRole: (updated as { staffRole?: string }).staffRole ?? 'admin',
      name: (updated as { name?: string }).name,
      email: (updated as { email?: string }).email,
      phone: (updated as { phone?: string }).phone,
      isActive: (updated as { isActive?: boolean }).isActive,
      photo: (updated as { photo?: string }).photo,
    });
  } catch (error) {
    console.error('Admin me PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
