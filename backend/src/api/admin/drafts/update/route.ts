import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { TeacherRegistration } from '@/lib/models/TeacherRegistration';
import { ParentRegistration } from '@/lib/models/ParentRegistration';
import { getAuthFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { type, id, data } = body;

    if (!type || !id || !data) {
      return NextResponse.json({ error: 'Type, id and data required' }, { status: 400 });
    }

    if (type === 'teacher') {
      const s1 = data.step1Data || {};
      if (s1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      if (s1.name !== undefined && !String(s1.name).trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      if (s1.phone && !/^\d{10}$/.test(String(s1.phone).replace(/\D/g, '').slice(-10))) {
        return NextResponse.json({ error: 'Phone must be 10 digits' }, { status: 400 });
      }
      if (s1.age !== undefined && (isNaN(Number(s1.age)) || Number(s1.age) < 1 || Number(s1.age) > 120)) {
        return NextResponse.json({ error: 'Age must be 1-120' }, { status: 400 });
      }
      if (data.currentStep !== undefined && (data.currentStep < 1 || data.currentStep > 5)) {
        return NextResponse.json({ error: 'Step must be 1-5' }, { status: 400 });
      }
      const update: Record<string, unknown> = {};
      if (data.step1Data) update.step1Data = data.step1Data;
      if (data.step2Data) update.step2Data = data.step2Data;
      if (data.step4Data) update.step4Data = data.step4Data;
      if (data.step5Data) update.step5Data = data.step5Data;
      if (data.currentStep !== undefined) update.currentStep = data.currentStep;
      if (data.status && ['in_progress', 'qualified', 'rejected', 'max_attempts_exceeded'].includes(data.status)) {
        update.status = data.status;
      }
      update.lastSavedAt = new Date();
      await TeacherRegistration.findByIdAndUpdate(id, update);
    } else if (type === 'parent') {
      const pd = data.data || {};
      if (pd.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pd.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      if (pd.name !== undefined && !String(pd.name).trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      const reg = await ParentRegistration.findById(id);
      const merged = { ...reg?.data, ...pd };
      await ParentRegistration.findByIdAndUpdate(id, {
        data: merged,
        lastSavedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
