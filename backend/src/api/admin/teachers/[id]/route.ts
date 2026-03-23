import { NextRequest, NextResponse } from '@/lib/next-compat';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { cacheInvalidatePattern } from '@/lib/cache';

const EDITABLE_FIELDS = [
  'name', 'phone', 'photoUrl', 'gender', 'dateOfBirth', 'qualification', 'profession', 'languages', 'experienceMonths', 'bio', 'demoVideoUrl',
  'board', 'classes', 'subjects', 'status', 'marketplaceOrder', 'commissionPercent',
  'bankDetails', 'batches', 'documents',
] as const;

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
    const body = (await request.json()) as any;

    let teacherId: mongoose.Types.ObjectId;
    try {
      teacherId = new mongoose.Types.ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    let hasUpdates = false;

    for (const key of EDITABLE_FIELDS) {
      if (body[key] === undefined) continue;
      if (key === 'marketplaceOrder') {
        const val = body[key];
        if (typeof val !== 'number' || val < 1) {
          return NextResponse.json({ error: 'marketplaceOrder must be a positive number' }, { status: 400 });
        }
        (teacher as unknown as Record<string, unknown>)[key] = val;
        hasUpdates = true;
        continue;
      }
      if (key === 'commissionPercent') {
        const val = body[key];
        const n = typeof val === 'number' ? val : parseInt(String(val ?? 10), 10);
        if (!isNaN(n) && n >= 0 && n <= 100) {
          teacher.commissionPercent = n;
          hasUpdates = true;
        }
        continue;
      }
      if (key === 'profession') {
        teacher.profession = String(body.profession ?? '');
        hasUpdates = true;
        continue;
      }
      if (key === 'languages') {
        teacher.languages = Array.isArray(body.languages) ? body.languages.map((l: unknown) => String(l)) : [];
        hasUpdates = true;
        continue;
      }
      if (key === 'experienceMonths') {
        if (body.experienceMonths === '' || body.experienceMonths === null || body.experienceMonths === undefined) {
          teacher.experienceMonths = undefined;
        } else {
          const n = typeof body.experienceMonths === 'number' ? body.experienceMonths : parseInt(String(body.experienceMonths), 10);
          if (!isNaN(n) && n >= 0) teacher.experienceMonths = n;
        }
        hasUpdates = true;
        continue;
      }
      if (key === 'dateOfBirth') {
        const val = body[key];
        if (val === '' || val === null || val === undefined) {
          (teacher as unknown as Record<string, unknown>).dateOfBirth = undefined;
        } else {
          const d = val instanceof Date ? val : new Date(val);
          if (!isNaN(d.getTime())) (teacher as unknown as Record<string, unknown>).dateOfBirth = d;
        }
        hasUpdates = true;
        continue;
      }
      (teacher as unknown as Record<string, unknown>)[key] = body[key];
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await teacher.save();

    await cacheInvalidatePattern('marketplace:*');
    const updated = await Teacher.findById(teacherId).select('-__v').lean();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Teacher update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
