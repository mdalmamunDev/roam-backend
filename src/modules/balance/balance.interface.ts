import { Types } from 'mongoose';


export type IBalanceKey = 'charge-balance' | 'app-balance';
export const BalanceKey: IBalanceKey[] = ['charge-balance', 'app-balance'];

interface IBalance {
  _id: Types.ObjectId;
  key: IBalanceKey;
  name: string;
  value: number;
}

export default IBalance;
