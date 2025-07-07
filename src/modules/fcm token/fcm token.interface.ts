import { Types } from 'mongoose';

export interface IFcmToken {
  _id: string;
  userId: Types.ObjectId;
  fcmToken: string;
}
