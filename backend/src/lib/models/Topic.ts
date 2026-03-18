import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopic extends Document {
  board: string;
  classLevel: string;
  subject: string;
  topic: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    board: { type: String, required: true },
    classLevel: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

TopicSchema.index({ board: 1, classLevel: 1, subject: 1 });
TopicSchema.index({ board: 1, classLevel: 1, subject: 1, topic: 1 }, { unique: true });

export const Topic: Model<ITopic> =
  mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
