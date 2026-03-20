import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Teacher } from '@/lib/models/Teacher';
import { Enrollment } from '@/lib/models/Enrollment';
import { generateFlashcardsFromStudyMaterial } from '@/lib/ai';
import { getAuthFromRequest } from '@/lib/auth';
import { logAIUsage } from '@/lib/ai-audit';

/** Option C: Generate flashcards from study material text */
export async function POST(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = (await request.json()) as Record<string, string>;
    const { studyMaterialText, topic, subject, board, classLevel } = body;

    if (!studyMaterialText || !topic || !subject) {
      return NextResponse.json({ error: 'studyMaterialText, topic and subject required' }, { status: 400 });
    }

    if (decoded.role === 'student' && board && classLevel) {
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const enrollment = await Enrollment.findOne({
        studentId: student._id,
        status: 'active',
        subject,
        board,
        classLevel,
      });
      if (!enrollment) {
        return NextResponse.json({ error: 'Flashcards only for subjects you have tuition for' }, { status: 403 });
      }
    } else if (decoded.role === 'teacher' && board && classLevel) {
      const teacher = await Teacher.findOne({ userId: decoded.userId });
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const hasCombo =
        teacher.board.includes(board) &&
        teacher.classes.includes(classLevel) &&
        teacher.subjects.includes(subject);
      if (!hasCombo) {
        return NextResponse.json({ error: 'Flashcards only for subjects you teach' }, { status: 403 });
      }
    }

    const start = Date.now();
    let result;
    try {
      result = await generateFlashcardsFromStudyMaterial(studyMaterialText, topic, subject);
    } catch (err) {
      await logAIUsage({
        operationType: 'generate_flashcards',
        userId: decoded.userId,
        userRole: decoded.role,
        inputMetadata: { topic, subject },
        durationMs: Date.now() - start,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
      throw err;
    }
    await logAIUsage({
      operationType: 'generate_flashcards',
      userId: decoded.userId,
      userRole: decoded.role,
      inputMetadata: { topic, subject },
      outputMetadata: { cardCount: result.cards?.length ?? 0 },
      durationMs: Date.now() - start,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate flashcards from material error:', error);
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 });
  }
}
