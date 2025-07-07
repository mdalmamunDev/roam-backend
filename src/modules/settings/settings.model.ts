import mongoose, { Schema } from 'mongoose';
import ISetting from './settings.interface';

const schema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: [true, 'Key is required'],
      unique: true,
    },
    name: {
      type: String,
      // required: [true, 'Name is required'],
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Value is required'],
    },
  },
  {
    // timestamps: true,
  }
);

const Setting = mongoose.model<ISetting>('Setting', schema);
export default Setting;
