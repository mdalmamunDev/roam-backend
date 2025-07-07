import mongoose, { Schema, Types } from 'mongoose';
import IMessage from './messages.interface';

export const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'MessageThread',
    },
    content: {
      type: String,
    },
    attachments: {
      type: [String],
      default: [],
    },
    receivedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
