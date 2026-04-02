import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { AdminStaff } from '@/lib/models/AdminStaff';

/** Public: Get team members (staff) for website. No auth. Sorted by createdAt asc (oldest first). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');

    await connectDB();

    const staff = await AdminStaff.find({ isActive: true })
      .select('name photo position department translations createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const team = staff.map((s) => {
      let position = (s as any).position || '';
      let department = (s as any).department || '';

      if (lang && s.translations && (s.translations as any)[lang]) {
        const trans = (s.translations as any)[lang];
        if (trans.position) position = trans.position;
        if (trans.department) department = trans.department;
      }

      return {
        name: s.name,
        photo: s.photo,
        position,
        department,
      };
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Website team fetch error:', error);
    return NextResponse.json({ team: [] });
  }
}
