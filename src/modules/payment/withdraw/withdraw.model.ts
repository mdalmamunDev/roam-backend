import mongoose, { Schema, Types } from 'mongoose';
import IWithdraw, { WithdrawStatus } from './withdraw.interface';

const schema = new Schema<IWithdraw>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, 'User Id is required.'],
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
