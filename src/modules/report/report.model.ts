import mongoose, { Schema } from 'mongoose';
import IReport, { ReportStatus } from './report.interface';

const promoSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ReportStatus,
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const Report = mongoose.model<IReport>('Report', promoSchema);
export default Report;
