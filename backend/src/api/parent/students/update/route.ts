import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { ConsentLog } from '@/lib/models/ConsentLog';
import { getAuthFromRequest } from '@/lib/auth';

const CONSENT_VERSION = 'v1.0';

export async function PUT(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const {
      studentId,
      name,
      dateOfBirth,
      classLevel,
      schoolName,
      board,
      photoUrl,
      idProofUrl,
      consentDataCollection,
      consentAiMonitoring,
    } = body;
    if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

    const student = await Student.findOne({ _id: studentId, parentId: parent._id });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    if (!consentDataCollection || !consentAiMonitoring) {
      return NextResponse.json(
        { error: 'You must accept both child data collection and AI monitoring consent' },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : student.dateOfBirth;
    if (classLevel !== undefined) update.classLevel = classLevel;
    if (schoolName !== undefined) update.schoolName = schoolName;
    if (board !== undefined) update.board = board;
    if (photoUrl !== undefined) update.photoUrl = photoUrl;
    if (idProofUrl !== undefined) update.idProofUrl = idProofUrl;

    await Student.findByIdAndUpdate(studentId, { $set: update });

    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    await ConsentLog.insertMany([
      {
        parentId: parent._id,
        studentId: student._id,
        consentType: 'child_data_collection',
        version: CONSENT_VERSION,
        ipAddress: ip,
        userAgent,
      },
      {
        parentId: parent._id,
        studentId: student._id,
        consentType: 'ai_monitoring',
        version: CONSENT_VERSION,
        ipAddress: ip,
        userAgent,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Parent student update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
