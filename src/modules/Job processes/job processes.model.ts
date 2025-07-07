import mongoose, { Schema } from 'mongoose';
import IJobProcess, { JobProcessStatus } from './job processes.interface';

const schema = new Schema<IJobProcess>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    services: [
      {
        _id: false,
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: 'Service',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    servicePrice: {
      type: Number
    },
    status: {
      type: String,
      enum: JobProcessStatus,
      default: 'requested',
    },
    rating: {
      type: Number,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const JobProcess = mongoose.model<IJobProcess>('Job Process', schema);
export default JobProcess;
