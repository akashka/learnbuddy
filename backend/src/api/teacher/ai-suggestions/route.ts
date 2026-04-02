import { NextRequest, NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Teacher } from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/auth';
import { aiGenerateJson } from '@/lib/ai-unified';
import { calculateTeacherProRata } from '@/lib/earning-utils';
import { logAIUsage } from '@/lib/ai-audit';

export async function GET(request: NextRequest) {
  try {
    const decoded = getAuthFromRequest(request);
    if (!decoded || decoded.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const teacher = await Teacher.findOne({ userId: decoded.userId }).lean();
    if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch basic earning data for context
    const earningData = await calculateTeacherProRata(teacher as any); // Cast as any to bypass mongoose Lean diffs for the utility

    const prompt = `
      You are an AI assistant helping a teacher on our online platform maximize their earnings and optimize their schedules.
      Teacher Profile:
      - Subjects: ${teacher.subjects?.join(', ') || 'N/A'}
      - Classes/Grades: ${teacher.classes?.join(', ') || 'N/A'}
      - Board: ${teacher.board?.join(', ') || 'N/A'}
      - Active Batches: ${teacher.batches?.length || 0}
      - Commission Rate: ${earningData.commissionPercent}%

      Current Earnings Data:
      - Expected Monthly Gross: ₹${earningData.summary.totalExpectedNet / (1 - earningData.commissionPercent/100)}
      - Current Expected Net: ₹${earningData.summary.totalExpectedNet}
      
      Look at the subjects and classes. Generate a short, encouraging set of insights with exactly 3 actionable points on:
      1. When/where to increase pricing or batch slots based on popular subjects (just general strategic advice).
      2. Suggestions to open weekend batches to attract more students.
      3. Highlight their current earning trajectory.

      Format as JSON: { "suggestions": ["point 1", "point 2", "point 3"], "summaryMessage": "A short 1-sentence motivational summary" }
    `;

    try {
      const response = await aiGenerateJson<{ suggestions: string[], summaryMessage: string }>(prompt);
      const parsed = response.data;
      
      // Log usage
      if (response.usage) {
        logAIUsage({
          operationType: 'teacher_ai_suggestion',
          userId: decoded.userId,
          userRole: decoded.role,
          success: true,
          modelId: response.usage.model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
        }).catch(console.error);
      }

      return NextResponse.json({ data: parsed });
    } catch (parseError) {
      console.error('Failed to parse AI JSON', parseError);
      
      logAIUsage({
        operationType: 'teacher_ai_suggestion',
        userId: decoded.userId,
        userRole: decoded.role,
        success: false,
        errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
      }).catch(console.error);

      return NextResponse.json({ 
        data: { 
          suggestions: ['Consider opening weekend batches to attract working parents.', 'Review your pricing for high-demand subjects in a few weeks.', 'Keep up the good work on maintaining classes consistently!'],
          summaryMessage: 'You are doing great! A slightly optimized schedule could increase your earnings.'
        } 
      });
    }

  } catch (error) {
    console.error('Teacher AI suggestions GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
