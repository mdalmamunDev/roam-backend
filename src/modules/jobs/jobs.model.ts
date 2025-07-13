import mongoose, { Schema } from 'mongoose';
import IJob, { JobIssues, JobStatus, JobVehicles } from './jobs.interface';

const jobSchema = new Schema<IJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicle: {
      type: String,
      enum: JobVehicles,
      required: true
    },
    issue: {
      type: String,
      enum: JobIssues,
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    fromLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    toLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    distance: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
    },
    comment: {
      type: String,
    },
    status: {
      type: String,
      enum: JobStatus,
      default: 'created'
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model<IJob>('Job', jobSchema);
export default Job;
