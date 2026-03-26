import mongoose, { Schema, Document, Model } from 'mongoose';

/** AI-generated or computed metrics for dashboard, updated by cron. */
export interface IDashboardMetrics extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'parent' | 'teacher' | 'student';
  /** For parent: aggregated across children. For teacher: their stats. */
  metrics: {
    performanceSummary?: string;
    suggestions?: string[];
    estimates?: { label: string; value: string; trend?: 'up' | 'down' | 'stable' }[];
    guidance?: string[];
    chartData?: { label: string; value: number; color?: string }[];
  };
  updatedAt: Date;
}

const DashboardMetricsSchema = new Schema<IDashboardMetrics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    role: { type: String, enum: ['parent', 'teacher', 'student'], required: true, index: true },
    metrics: {
      performanceSummary: String,
      suggestions: [String],
      estimates: [{
        label: String,
        value: String,
        trend: { type: String, enum: ['up', 'down', 'stable'] },
      }],
      guidance: [String],
      chartData: [{
        label: String,
        value: Number,
        color: String,
      }],
    },
  },
  { timestamps: true }
);

export const DashboardMetrics: Model<IDashboardMetrics> =
  mongoose.models.DashboardMetrics || mongoose.model<IDashboardMetrics>('DashboardMetrics', DashboardMetricsSchema);
