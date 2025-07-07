import mongoose, { Schema } from 'mongoose';
import ITool from './tool.interface';

const schema = new Schema<ITool>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Tool is required'],
    },
    group: {
      type: String,
      default: 'Others',
    },
  },
  {
    timestamps: true,
  }
);

const Tool = mongoose.model<ITool>('Tool', schema);
export default Tool;
