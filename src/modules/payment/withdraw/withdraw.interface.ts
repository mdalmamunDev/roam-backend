import { ObjectId } from "mongoose";

export type IWithdrawStatus = 'pending' | 'success' | 'canceled';
export const WithdrawStatus: IWithdrawStatus[] = ['pending', 'success', 'canceled'];

interface IWithdraw {
  userId: ObjectId,
  amount: number,
  charge: number,
  status: IWithdrawStatus,
}

export default IWithdraw;
