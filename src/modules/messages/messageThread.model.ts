import mongoose, { Schema } from 'mongoose';
import IMessageThread from './messageThread.interface';

const messageThreadSchema = new Schema<IMessageThread>({
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }], // 2 users (or more for group chat)
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message' }, // Reference to the last message in the thread
    unreadCount: { type: Map, of: Number, default: {} }, // { userId: count }
}, { timestamps: true });

const MessageThread = mongoose.model<IMessageThread>('MessageThread', messageThreadSchema);
export default MessageThread;
