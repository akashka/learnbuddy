import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { ParentWishlist } from '@/lib/models/ParentWishlist';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId }).lean();
    if (!parent) return NextResponse.json({ checklist: [], allDone: false });

    const user = await User.findById(decoded.userId).lean();
    const emailVerified = !!(user?.emailVerifiedAt);

    const wishlistCount = await ParentWishlist.countDocuments({ parentId: parent._id });

    const items: ChecklistItem[] = [
      {
        id: 'phone',
        label: 'Verify phone number',
        done: !!(parent.phone?.trim()),
        href: '/parent/dashboard',
        cta: 'Phone verified',
      },
      {
        id: 'email',
        label: 'Verify email address',
        done: emailVerified,
        href: '/parent/profile',
        cta: emailVerified ? 'Email verified' : 'Add & verify email',
      },
      {
        id: 'student',
        label: 'Add at least one student',
        done: (parent.children?.length ?? 0) > 0,
        href: '/parent/students',
        cta: (parent.children?.length ?? 0) > 0 ? 'Student added' : 'Add student',
      },
      {
        id: 'search',
        label: 'Search for a teacher',
        done: wishlistCount > 0,
        href: '/parent/marketplace',
        cta: wishlistCount > 0 ? 'Searched teachers' : 'Search teachers',
      },
    ];

    const allDone = items.every((i) => i.done);

    return NextResponse.json({ checklist: items, allDone });
  } catch (error) {
    console.error('Parent onboarding status error:', error);
    return NextResponse.json({ checklist: [], allDone: false }, { status: 500 });
  }
}
