/**
 * AI usage audit logging - logs all AI invocations for compliance and auditing.
 * Call from API routes after AI operations with sanitized metadata (no PII, no raw media).
 */
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { AIUsageLog, type AIOperationType } from '@/lib/models/AIUsageLog';
import { calculateAICost } from './ai-pricing';

const USE_AI_SERVICE = !!process.env.AI_SERVICE_URL && !!process.env.AI_SERVICE_API_KEY;

export interface AIAuditParams {
  operationType: AIOperationType;
  userId?: mongoose.Types.ObjectId | string;
  userRole?: string;
  entityId?: mongoose.Types.ObjectId | string;
  entityType?: string;
  inputMetadata?: Record<string, unknown>;
  outputMetadata?: Record<string, unknown>;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
  modelId?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
}

export async function logAIUsage(params: AIAuditParams): Promise<void> {
  try {
    await connectDB();
    const promptTokens = params.promptTokens || 0;
    const completionTokens = params.completionTokens || 0;
    const totalTokens = params.totalTokens || (promptTokens + completionTokens);
    const cost = params.cost ?? (params.modelId ? calculateAICost(params.modelId, promptTokens, completionTokens) : 0);

    await AIUsageLog.create({
      operationType: params.operationType,
      userId: params.userId ? new mongoose.Types.ObjectId(String(params.userId)) : undefined,
      userRole: params.userRole,
      source: USE_AI_SERVICE ? 'ai_service' : 'local_gemini',
      entityId: params.entityId ? new mongoose.Types.ObjectId(String(params.entityId)) : undefined,
      entityType: params.entityType,
      inputMetadata: params.inputMetadata,
      outputMetadata: params.outputMetadata,
      durationMs: params.durationMs,
      success: params.success,
      errorMessage: params.errorMessage,
      modelId: params.modelId,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
    });
  } catch (err) {
    console.error('AI audit log failed:', err);
    // Non-blocking - don't throw, audit failure shouldn't break the main flow
  }
}
