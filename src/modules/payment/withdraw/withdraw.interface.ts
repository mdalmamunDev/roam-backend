import { ObjectId } from "mongoose";

export type IWithdrawStatus = 'pending' | 'success' | 'accepted' | 'canceled' | 'failed';
export const WithdrawStatus: IWithdrawStatus[] = ['pending', 'success', 'accepted', 'canceled', 'failed'];

interface IWithdraw {
  userId: ObjectId,
  trId: String,
  amount: number,
  charge: number,
  status: IWithdrawStatus,
}

export default IWithdraw;
