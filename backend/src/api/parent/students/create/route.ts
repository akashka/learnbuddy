import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Parent } from '@/lib/models/Parent';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { ConsentLog } from '@/lib/models/ConsentLog';
import { hashPassword } from '@/lib/auth';
import { getAuthFromRequest } from '@/lib/auth';

const CONSENT_VERSION = 'v1.0';

function generateStudentId(): string {
  return 'STU' + Date.now().toString(36).toUpperCase().slice(-6);
}

/** Generate easy-to-remember password: studentId + year of birth (e.g. STU1234562008) */
function generateEasyPassword(studentId: string, dateOfBirth?: Date | string | null): string {
  if (dateOfBirth) {
    const d = new Date(dateOfBirth);
    const year = d.getFullYear();
    return studentId + year;
  }
  return studentId + new Date().getFullYear();
}

export async function POST(request: NextRequest) {
  try {
        const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const parent = await Parent.findOne({ userId: decoded.userId });
    if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await request.json()) as any;
    const {
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

    if (!name || !classLevel || !board) {
      return NextResponse.json(
        { error: 'Name, class and board are required' },
        { status: 400 }
      );
    }
    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth is required' },
        { status: 400 }
      );
    }
    const photo = photoUrl != null ? String(photoUrl).trim() : '';
    const idProof = idProofUrl != null ? String(idProofUrl).trim() : '';
    if (!photo) {
      return NextResponse.json(
        { error: 'Student photo is required for identity verification and AI checks' },
        { status: 400 }
      );
    }
    if (!idProof) {
      return NextResponse.json(
        { error: 'Student ID proof image is required for verification' },
        { status: 400 }
      );
    }
    if (!consentDataCollection || !consentAiMonitoring) {
      return NextResponse.json(
        { error: 'You must accept both child data collection and AI monitoring consent' },
        { status: 400 }
      );
    }

    const studentId = generateStudentId();
    const tempPassword = generateEasyPassword(studentId, dateOfBirth);
    const hashedPassword = await hashPassword(tempPassword);

    const user = await User.create({
      email: `${studentId.toLowerCase()}@guruchakra.local`,
      password: hashedPassword,
      role: 'student',
    });

    const student = await Student.create({
      studentId,
      userId: user._id,
      parentId: parent._id,
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      classLevel,
      schoolName: schoolName || undefined,
      board,
      photoUrl: photo,
      idProofUrl: idProof,
      enrollments: [],
    });

    await Parent.findByIdAndUpdate(parent._id, {
      $addToSet: { children: student._id },
    });

    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || (request.socket as { remoteAddress?: string })?.remoteAddress;
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

    return NextResponse.json({
      success: true,
      studentId,
      password: tempPassword,
      student: {
        _id: student._id,
        studentId,
        name,
        dateOfBirth: student.dateOfBirth,
        classLevel,
        schoolName: student.schoolName,
        board,
        photoUrl: student.photoUrl,
        idProofUrl: student.idProofUrl,
      },
    });
  } catch (error) {
    console.error('Parent student create error:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
