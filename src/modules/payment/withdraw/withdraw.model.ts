import mongoose, { Schema, Types } from 'mongoose';
import IWithdraw, { WithdrawStatus } from './withdraw.interface';

const schema = new Schema<IWithdraw>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, 'User Id is required.'],
    },
    trId: {
      type: String,
      unique: true,
    },
    account_number: {
      type: String,
      required: true,
    },
    bank_code: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
    },
    charge: {
      type: Number,
    },
    status: {
      type: String,
      enum: WithdrawStatus,  // Enum of possible statuses
      default: 'pending',  // Default status if not provided
    },
  },
  {
    timestamps: true,
  }
);

const Withdraw = mongoose.model<IWithdraw>('Withdraw', schema);
export default Withdraw;
