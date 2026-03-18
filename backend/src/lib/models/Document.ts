import mongoose, { Schema, Document as MongooseDocument, Model, Types } from 'mongoose';

export interface IDocumentVersion {
  url: string;
  version: number;
  uploadedAt: Date;
  originalFilename: string;
}

export interface IDocument extends MongooseDocument {
  name: string;
  folderId: Types.ObjectId | null;
  category: string;
  allowedRoles: string[];
  versions: IDocumentVersion[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>(
  {
    url: { type: String, required: true },
    version: { type: Number, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    originalFilename: { type: String, required: true },
  },
  { _id: false }
);

const DocumentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'DocumentFolder', default: null },
    category: { type: String, default: 'General' },
    allowedRoles: { type: [String], default: ['admin', 'teacher', 'parent', 'student'] },
    versions: { type: [DocumentVersionSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Document: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
