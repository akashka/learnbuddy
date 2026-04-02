import mongoose, { Schema, Document, Model } from 'mongoose';

export type AlertType = 'face_mismatch' | 'camera_off' | 'voice_off' | 'absent' | 'background_noise' | 'extra_person' | 'foul_language' | 'sentiment_risk' | 'other';

export interface IAIAlert extends Document {
  sessionId?: mongoose.Types.ObjectId;
  type: AlertType;
  severity: 'warning' | 'critical';
  message: string;
  userId: mongoose.Types.ObjectId;
  userRole: 'student' | 'teacher';
  acknowledged: boolean;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  createdAt: Date;
}

const AIAlertSchema = new Schema<IAIAlert>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession', required: false },
    type: { type: String, enum: ['face_mismatch', 'camera_off', 'voice_off', 'absent', 'background_noise', 'extra_person', 'foul_language', 'sentiment_risk', 'other'] },
    severity: { type: String, enum: ['warning', 'critical'] },
    message: String,
    userId: { type: Schema.Types.ObjectId, required: true },
    userRole: { type: String, enum: ['student', 'teacher'] },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: Schema.Types.ObjectId,
    acknowledgedAt: Date,
  },
  { timestamps: true }
);

export const AIAlert: Model<IAIAlert> = mongoose.models.AIAlert || mongoose.model<IAIAlert>('AIAlert', AIAlertSchema);
