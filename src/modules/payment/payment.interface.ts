import { ObjectId } from "mongoose";

export type IPaymentStatus = 'pending' | 'success' | 'failed';
export const PaymentStatus: IPaymentStatus[] = ['pending', 'success', 'failed'];

interface IPayment {
  userId: ObjectId,
  trId?: String,
  amount: number,
  status: IPaymentStatus,
}

export default IPayment;
