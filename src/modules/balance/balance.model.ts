import mongoose, { Schema } from 'mongoose';
import IBalance, { BalanceKey } from './balance.interface';

const schema = new Schema<IBalance>(
  {
    key: {
      type: String,
      enum: BalanceKey,
      required: [true, 'Key is required'],
      unique: true,
    },
    name: {
      type: String,
      // required: [true, 'Name is required'],
    },
    value: {
      type: Number,
      required: [true, 'Value is required'],
    },
  },
  {
    // timestamps: true,
  }
);

const Balance = mongoose.model<IBalance>('Balance', schema);
export default Balance;
