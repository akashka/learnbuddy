import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { User } from '@/lib/models/User';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId })
      .populate('userId', 'email')
      .lean();

    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      name: teacher.name,
      email: (teacher.userId as { email?: string })?.email,
      phone: teacher.phone,
      photoUrl: teacher.photoUrl,
      qualification: teacher.qualification,
      profession: teacher.profession,
      languages: teacher.languages || [],
      experienceMonths: teacher.experienceMonths,
      bio: teacher.bio,
      bankDetails: teacher.bankDetails,
      demoVideoUrl: teacher.demoVideoUrl,
      documents: teacher.documents,
    });
  } catch (error) {
    console.error('Teacher profile error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as any;
    const { name, qualification, profession, languages, experienceMonths, bio, bankDetails, demoVideoUrl, photoUrl, documents } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (photoUrl !== undefined) update.photoUrl = photoUrl;
    if (qualification !== undefined) update.qualification = qualification;
    if (profession !== undefined) update.profession = profession;
    if (languages !== undefined) update.languages = languages;
    if (experienceMonths !== undefined) update.experienceMonths = experienceMonths;
    if (bio !== undefined) update.bio = bio;
    if (bankDetails !== undefined) update.bankDetails = bankDetails;
    if (demoVideoUrl !== undefined) update.demoVideoUrl = demoVideoUrl;
    if (documents !== undefined) {
      const teacher = await Teacher.findOne({ userId: decoded.userId }).select('documents').lean();
      const existing = (teacher?.documents || []) as { name?: string; url?: string; verified?: boolean; uploadedAt?: Date }[];
      const existingByUrl = new Map(existing.map((d) => [d.url, d]));
      const now = new Date();
      update.documents = Array.isArray(documents)
        ? documents.map((d: { name?: string; url?: string }) => {
            const url = String(d.url || '');
            const prev = existingByUrl.get(url);
            return {
              name: String(d.name || 'document'),
              url,
              ...(prev?.verified != null && { verified: prev.verified }),
              uploadedAt: prev?.uploadedAt || now,
            };
          })
        : [];
    }

    await Teacher.findOneAndUpdate({ userId: decoded.userId }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher profile update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
