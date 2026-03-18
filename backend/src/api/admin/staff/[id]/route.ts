import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const staff = await AdminStaff.findById(id)
      .populate('userId', 'email isActive createdAt')
      .lean();

    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff detail error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, photo, email, phone, staffRole, position, department, isActive } = body;

    const staff = await AdminStaff.findById(id);
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

    const update: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};
    if (name !== undefined) update.name = name.trim();
    if (photo !== undefined) {
      if (photo != null && String(photo).trim()) {
        update.photo = String(photo).trim();
      } else {
        unset.photo = 1;
      }
    }
    if (phone !== undefined) update.phone = phone?.trim() || undefined;
    if (staffRole !== undefined) {
      const validRoles = ['admin', 'sales', 'marketing', 'hr', 'finance'];
      if (!validRoles.includes(staffRole)) {
        return NextResponse.json({ error: 'Invalid staffRole' }, { status: 400 });
      }
      update.staffRole = staffRole;
    }
    if (position !== undefined) {
      const v = position?.trim();
      if (v) update.position = v;
      else unset.position = 1;
    }
    if (department !== undefined) {
      const v = department?.trim();
      if (v) update.department = v;
      else unset.department = 1;
    }
    if (typeof isActive === 'boolean') update.isActive = isActive;

    if (email !== undefined && email.trim().toLowerCase() !== staff.email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing && existing._id.toString() !== staff.userId.toString()) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      update.email = email.trim().toLowerCase();
      await User.findByIdAndUpdate(staff.userId, { $set: { email: email.trim().toLowerCase() } });
    }

    const updateOp: Record<string, unknown> = {};
    if (Object.keys(update).length) updateOp.$set = update;
    if (Object.keys(unset).length) updateOp.$unset = unset;
    const updated = await AdminStaff.findByIdAndUpdate(id, updateOp, { new: true })
      .populate('userId', 'email isActive')
      .lean();

    if (typeof isActive === 'boolean') {
      await User.findByIdAndUpdate(staff.userId, { $set: { isActive } });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
