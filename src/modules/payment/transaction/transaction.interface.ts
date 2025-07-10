import { Types } from 'mongoose';

export type ITransactionStatus = 'created' | 'sent' | 'received' | 'refunded';
export const TransactionStatus: ITransactionStatus[] = ['created', 'sent', 'received', 'refunded'];

interface ITransaction {
  userId: Types.ObjectId;
  providerId: Types.ObjectId;
  jobId: Types.ObjectId;
  amount: number,
  charge: number,
  discount: number,
  finalAmount: number,
  isRefundRequested: boolean,
  refundDetails: string,
  status: ITransactionStatus,
}

export default ITransaction;