import { Types } from 'mongoose';
import IMessage from './messages.interface';


interface IMessageThread {
    _id: Types.ObjectId;
    participants: Types.ObjectId[]; // 2 users (or more for group chat)
    lastMessageId: Types.ObjectId; // Reference to the last message in the thread
    unreadCount: Map<Types.ObjectId, number>; // { userId: count }
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

export default IMessageThread;
