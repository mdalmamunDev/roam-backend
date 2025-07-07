import { Model, Types } from 'mongoose';

export interface INotification {
  _id: Types.ObjectId;
  receiverId: Types.ObjectId | string;
  title: string;
  message: string;
  viewStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
}
