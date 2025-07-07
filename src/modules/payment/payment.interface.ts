import { ObjectId } from "mongoose";

export type IPaymentStatus = 'pending' | 'success' | 'failed';
export const PaymentStatus: IPaymentStatus[] = ['pending', 'success', 'failed'];

interface IPayment {
  sessionId: string,
  trId: string,
  userId: ObjectId,
  amount: number,
  status: IPaymentStatus,
}

export default IPayment;
