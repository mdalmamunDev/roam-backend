import mongoose, { Schema } from 'mongoose';
import IJob, { JobStatus } from './jobs.interface';
import { UserPlatform, UserRole } from '../user/user.constant';

const schema = new Schema<IJob>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    carModelId: {
      type: Schema.Types.ObjectId,
      ref: 'Car Model',
    },
    platform: {
      type: String,
      enum: UserPlatform,
    },
    targets: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    destination: {
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
    date: String,
    time: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: JobStatus,
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model<IJob>('Job', schema);
export default Job;
