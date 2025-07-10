import mongoose, { Schema } from 'mongoose';
import ITowType from './tow type.interface';

const schema = new Schema<ITowType>(
  {
    name: {
      type: String,
      // required: [true, 'Name is required'],
    },
    baseFare: {
      type: Number,
      required: [true, 'Value is required'],
    },
    perKM: {
      type: Number,
      required: [true, 'Value is required'],
    },
    charge: {
      type: Number,
      required: [true, 'Value is required'],
    },
  },
  {
    // timestamps: true,
  }
);

const TowType = mongoose.model<ITowType>('TowType', schema);
export default TowType;
