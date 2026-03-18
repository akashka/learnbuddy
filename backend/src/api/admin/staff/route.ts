import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';
import { User } from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const staffRole = searchParams.get('staffRole');
    const isActive = searchParams.get('isActive');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (staffRole) query.staffRole = staffRole;
    if (isActive === 'true' || isActive === 'false') {
      query.isActive = isActive === 'true';
    }

    let staff = await AdminStaff.find(query)
      .populate('userId', 'email isActive')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .lean();

    if (search) {
      const searchLower = search.toLowerCase();
      staff = staff.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(searchLower) ||
          (s.email || '').toLowerCase().includes(searchLower) ||
          (s.phone || '').includes(search)
      );
    }

    const total = staff.length;
    const start = (page - 1) * limit;
    const paginated = staff.slice(start, start + limit);

    return NextResponse.json({
      staff: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Staff list error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, photo, email, phone, staffRole, position, department, password } = body;

    if (!name || !email || !staffRole) {
      return NextResponse.json({ error: 'Name, email and staffRole are required' }, { status: 400 });
    }

    const validRoles = ['admin', 'sales', 'marketing', 'hr', 'finance'];
    if (!validRoles.includes(staffRole)) {
      return NextResponse.json({ error: 'Invalid staffRole' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const existingStaff = await AdminStaff.findOne({ email: email.trim().toLowerCase() });
    if (existingStaff) {
      return NextResponse.json({ error: 'Staff with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password || 'Welcome123');
    const user = await User.create({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    const staff = await AdminStaff.create({
      userId: user._id,
      name: name.trim(),
      photo: photo || undefined,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      staffRole,
      position: position?.trim() || undefined,
      department: department?.trim() || undefined,
      isActive: true,
    });

    const populated = await AdminStaff.findById(staff._id)
      .populate('userId', 'email isActive')
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    console.error('Staff create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
