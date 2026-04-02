import mongoose from 'mongoose';
import connectDB from './backend/src/lib/db';
import { AIUsageLog } from './backend/src/lib/models/AIUsageLog';
import { runSentimentAlertsJob } from './backend/src/lib/jobs/cron-sentiment-alerts';

async function verify() {
  console.log('Connecting to DB...');
  await connectDB();

  const mockUserId = new mongoose.Types.ObjectId();

  console.log('Creating mock low-sentiment log...');
  await AIUsageLog.create({
    operationType: 'sentiment_analysis',
    userId: mockUserId,
    userRole: 'student',
    source: 'local_gemini',
    success: true,
    outputMetadata: { score: 0.1, flags: ['frustration'] },
    promptTokens: 10,
    completionTokens: 5,
    totalTokens: 15,
    cost: 0.0001,
  });

  console.log('Running aggregation job...');
  await runSentimentAlertsJob();

  console.log('Verification finished. Check DB for AIAlert for userId:', mockUserId);
  process.exit(0);
}

verify().catch(console.error);
