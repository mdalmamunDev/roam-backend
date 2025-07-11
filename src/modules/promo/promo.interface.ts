import { Types } from 'mongoose';

export type IPromoType = 'fixed' | 'percent';
export const PromoTypes: IPromoType[] = ['fixed', 'percent'];

export type IPromoStatus= 'active' | 'inactive';
export const PromoStatus: IPromoStatus[] = ['active', 'inactive'];

interface IPromo {
  _id: Types.ObjectId;
  users: [Types.ObjectId];
  code: string,
  type: IPromoType;
  value: number;
  expireDate: Date;
  status: IPromoStatus;
}

export default IPromo;
