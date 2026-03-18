/**
 * Store AI-generated content in DB for admin review and mastering AI data.
 */
import { AIGeneratedContent, type AIContentType } from '@/lib/models/AIGeneratedContent';
import type mongoose from 'mongoose';

export interface SaveAIDataParams {
  type: AIContentType;
  board: string;
  classLevel: string;
  subject: string;
  topic?: string;
  topics?: string[];
  question?: string;
  content: Record<string, unknown>;
  requestedBy?: mongoose.Types.ObjectId;
  requesterRole?: 'student' | 'teacher';
  metadata?: Record<string, unknown>;
}

export async function saveAIGeneratedContent(params: SaveAIDataParams): Promise<string | null> {
  try {
    const doc = await AIGeneratedContent.create({
      type: params.type,
      board: params.board,
      classLevel: params.classLevel,
      subject: params.subject,
      topic: params.topic,
      topics: params.topics,
      question: params.question,
      content: params.content,
      requestedBy: params.requestedBy,
      requesterRole: params.requesterRole,
      metadata: params.metadata,
    });
    return doc._id?.toString() ?? null;
  } catch (err) {
    console.error('Failed to save AI generated content:', err);
    return null;
  }
}
