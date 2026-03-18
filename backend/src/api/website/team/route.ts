import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';

/** Public: Get team members (staff) for website. No auth. Sorted by createdAt asc (oldest first). */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const staff = await AdminStaff.find({ isActive: true })
      .select('name photo position department createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const team = staff.map((s) => ({
      name: s.name,
      photo: s.photo,
      position: (s as { position?: string }).position || '',
      department: (s as { department?: string }).department || '',
    }));

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Website team fetch error:', error);
    return NextResponse.json({ team: [] });
  }
}
