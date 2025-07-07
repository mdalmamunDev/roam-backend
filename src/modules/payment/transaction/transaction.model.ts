import mongoose, { Schema } from 'mongoose';
import ITransaction, { TransactionStatus, TransactionType } from './transaction.interface';

const schema = new Schema<ITransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',  // This will reference the 'User' model
      required: [true, 'Customer ID is required.'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',  // This will reference the 'User' model
      required: [true, 'Provider ID is required.'],
    },
    jobProcessId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',  // This will reference the 'Job' model
      required: [true, 'Job ID is required.'],
    },
    type: {
      type: String,
      enum: TransactionType,  // Only allows 'transport' or 'service'
      required: [true, 'Transaction type is required.'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
    },
    isRefundRequested: {
      type: Boolean,
      default: false,  // Default to false, indicating no refund request
    },
    refundImages: {
      type: [String],
    },
    refundDetails: {
      type: String
    },
    status: {
      type: String,
      enum: TransactionStatus,  // Enum of possible statuses
      default: 'created',  // Default status if not provided
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransaction>('Transaction', schema);
export default Transaction;
