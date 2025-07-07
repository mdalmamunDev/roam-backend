import mongoose, { Schema } from 'mongoose';
import IExperience from './experiences.interface';

const schema = new Schema<IExperience>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Experience name is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Experience = mongoose.model<IExperience>('Experience', schema);
export default Experience;
