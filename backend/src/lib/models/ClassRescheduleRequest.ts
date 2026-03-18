import mongoose, { Schema, Document, Model } from 'mongoose';

export type RescheduleRequestStatus = 'pending' | 'confirmed' | 'rejected' | 'expired';

export interface IProposedSlot {
  date: Date;
  startTime: string;
  endTime: string;
}

export interface IClassRescheduleRequest extends Document {
  sessionId: mongoose.Types.ObjectId;
  /** Who initiated: student | parent | teacher */
  initiatedByRole: 'student' | 'parent' | 'teacher';
  /** Profile ID: Student._id, Parent._id, or Teacher._id */
  initiatedByProfileId: mongoose.Types.ObjectId;
  reason: string;
  /** 1-2 proposed date/time options for the second party to choose */
  proposedSlots: IProposedSlot[];
  status: RescheduleRequestStatus;
  /** Index (0 or 1) of the slot confirmed by second party */
  confirmedSlotIndex?: number;
  /** Profile ID of who confirmed (Teacher, Parent, or Student) */
  confirmedByProfileId?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  /** New ClassSession created when confirmed */
  newSessionId?: mongoose.Types.ObjectId;
  rejectedReason?: string;
  expiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProposedSlotSchema = new Schema<IProposedSlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const ClassRescheduleRequestSchema = new Schema<IClassRescheduleRequest>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession', required: true },
    initiatedByRole: { type: String, enum: ['student', 'parent', 'teacher'], required: true },
    initiatedByProfileId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    proposedSlots: { type: [ProposedSlotSchema], required: true, validate: [slotsLength, 'Must have 1-2 proposed slots'] },
    status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'expired'], default: 'pending' },
    confirmedSlotIndex: Number,
    confirmedByProfileId: Schema.Types.ObjectId,
    confirmedAt: Date,
    newSessionId: { type: Schema.Types.ObjectId, ref: 'ClassSession' },
    rejectedReason: String,
    expiredAt: Date,
  },
  { timestamps: true }
);

function slotsLength(v: IProposedSlot[]) {
  return v && v.length >= 1 && v.length <= 2;
}

export const ClassRescheduleRequest: Model<IClassRescheduleRequest> =
  mongoose.models.ClassRescheduleRequest ||
  mongoose.model<IClassRescheduleRequest>('ClassRescheduleRequest', ClassRescheduleRequestSchema);
