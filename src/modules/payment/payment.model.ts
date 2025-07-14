import mongoose, { Schema, Types } from 'mongoose';
import IPayment, { PaymentStatus } from './payment.interface';

const schema = new Schema<IPayment>(
  {
        userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required.'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
    },
    status: {
      type: String,
      enum: PaymentStatus,  // Enum of possible statuses
      default: 'pending',  // Default status if not provided
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model<IPayment>('Payment', schema);
export default Payment;
