import mongoose, { Schema } from 'mongoose';
import IService from './services.interface';

const schema = new Schema<IService>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model<IService>('Service', schema);
export default Service;
