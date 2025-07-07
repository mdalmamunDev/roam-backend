import { Types } from 'mongoose';

export type ITransactionType = 'transport' | 'service';
export const TransactionType: ITransactionType[] = ['transport', 'service'];

export type ITransactionStatus = 'created' | 'success' | 'failed' | 'refunded';
export const TransactionStatus: ITransactionStatus[] = ['created', 'success', 'failed', 'refunded'];

interface ITransaction {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  jobProcessId: Types.ObjectId;
  type: ITransactionType,
  amount: number,
  isRefundRequested: boolean,
  refundImages: string[],
  refundDetails: string,
  status: ITransactionStatus,
}

export default ITransaction;