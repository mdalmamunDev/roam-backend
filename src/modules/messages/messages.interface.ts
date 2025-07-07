import { Types } from 'mongoose';

interface IMessage {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  threadId: Types.ObjectId;
  content: string;
  attachments?: string[];
  receivedBy: Types.ObjectId[];
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export default IMessage;
