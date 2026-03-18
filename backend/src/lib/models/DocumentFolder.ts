import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDocumentFolder extends Document {
  name: string;
  parentId: Types.ObjectId | null;
  allowedRoles: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFolderSchema = new Schema<IDocumentFolder>(
  {
    name: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'DocumentFolder', default: null },
    allowedRoles: { type: [String], default: ['admin', 'teacher', 'parent', 'student'] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DocumentFolder: Model<IDocumentFolder> =
  mongoose.models.DocumentFolder || mongoose.model<IDocumentFolder>('DocumentFolder', DocumentFolderSchema);
