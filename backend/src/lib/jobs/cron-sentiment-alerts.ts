import { AIUsageLog } from '@/lib/models/AIUsageLog';
import { AIAlert } from '@/lib/models/AIAlert';
import { Student } from '@/lib/models/Student';
import mongoose from 'mongoose';

/**
 * Aggregates sentiment scores for students over the last 24 hours 
 * and generates alerts for "at-risk" students (avg sentiment < 0.4).
 */
export async function runSentimentAlertsJob() {
  console.log('[SentimentAlertsJob] Starting aggregation...');
  
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  try {
    // 1. Aggregate sentiment data
    const results = await AIUsageLog.aggregate([
      {
        $match: {
          operationType: 'sentiment_analysis',
          createdAt: { $gte: twentyFourHoursAgo },
          userId: { $exists: true, $ne: null },
          userRole: 'student',
          success: true,
        }
      },
      {
        $group: {
          _id: '$userId',
          avgSentiment: { $avg: { $toDouble: '$outputMetadata.score' } },
          totalInteractions: { $sum: 1 },
          lastInteraction: { $max: '$createdAt' }
        }
      },
      {
        $match: {
          avgSentiment: { $lt: 0.4 },
          totalInteractions: { $gte: 1 } // Even one low sentiment interaction triggers a check
        }
      }
    ]);

    console.log(`[SentimentAlertsJob] Found ${results.length} students at risk.`);

    for (const res of results) {
      const userId = res._id;
      const avgSentiment = res.avgSentiment;
      
      // Get student details
      const student = await Student.findOne({ userId }).populate('userId');
      const studentName = (student as any)?.userId?.name || 'Student';

      // 2. Check if an active alert already exists for this student in the last 24h
      const existingAlert = await AIAlert.findOne({
        userId,
        type: 'sentiment_risk',
        createdAt: { $gte: twentyFourHoursAgo },
        acknowledged: false
      });

      if (!existingAlert) {
        // 3. Create Alert
        await AIAlert.create({
          type: 'sentiment_risk',
          severity: avgSentiment < 0.2 ? 'critical' : 'warning',
          message: `Proactive Alert: ${studentName} shows consistently low sentiment (Avg: ${avgSentiment.toFixed(2)}) in recent AI interactions. Possible frustration or difficulty.`,
          userId,
          userRole: 'student'
        });
        
        console.log(`[SentimentAlertsJob] Created alert for student: ${userId}`);
      }
    }
    
    console.log('[SentimentAlertsJob] Completed successfully.');
  } catch (error) {
    console.error('[SentimentAlertsJob] Error:', error);
  }
}
