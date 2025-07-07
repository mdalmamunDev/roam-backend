import MessageThread from './messageThread.model';
import Message from './messages.model'; // your existing message model
import { Types } from 'mongoose';
import { logger } from '../../shared/logger';
import colors from 'colors';

class service {
    // Send a new message (and update thread)
    async sendMessage(data: { senderId: string, threadId: string, content: string, attachments: string[] }) {
        try {
            const { senderId, threadId, content, attachments } = data;

            // 1. Save the actual message
            const newMessage = await Message.create({ senderId, content, attachments, threadId });

            if (!newMessage) {
                // @ts-ignore
                io.to(senderId).emit('message-send-error', data);
                logger.error(colors.red('Failed to save message to database'));
                return;
            }

            // Find existing thread
            let thread = await MessageThread.findById(threadId);

            // If no thread, create a new one
            if (!thread) {
                // @ts-ignore
                io.to(senderId).emit('message-send-error', data);
                logger.error(colors.red('Failed to save message to thread'));
                return;
            }


            
            // Update existing thread
            thread.lastMessageId = newMessage._id;

            for (const participant of thread.participants) {
                if (!participant.equals(senderId)) {
                    const unread = thread.unreadCount.get(participant) || 0;
                    thread.unreadCount.set(participant, unread + 1);
                }
            }

            await thread.save();
            


            // const populatedMessage = await Message.findById(newMessage._id)
            //     .populate('senderId', 'name profileImage')
            //     .populate('threadId'); // Populate senderId with name and profileImage, and threadId

            // Broadcast the message to other participants
            for (const participant of thread.participants) {
                // if (participant.toString() === senderId.toString()) continue; // Better comparison
                // @ts-ignore
                io.to(participant.toString()).emit('message-receive', newMessage); // Send the message to the receiver
                logger.info(colors.green(`Message sent from ${senderId} to ${participant}: ${content}`));
            }

        } catch (error) {
            console.error('Message error:', error);
        }
    }
    // Mark thread messages as read
    async markThreadAsRead(threadId: Types.ObjectId | string, readerId: Types.ObjectId | string) {
        try {
            const thread = await MessageThread.findById(threadId).populate('participants', 'name profileImage');
            if (!thread) {
                logger.error(colors.red(`Thread with ID ${threadId} not found`));
                throw new Error('Thread not found');
            }

            // Set unread count for the reader to 0
            thread.unreadCount.set(new Types.ObjectId(readerId), 0);
            await thread.save();

            // Update all messages readBy by the reader
            const msgs = await Message.updateMany(
                { threadId, senderId: { $ne: readerId }, readBy: { $ne: readerId } },
                {
                    $addToSet: { readBy: readerId },
                    $pull: { receivedBy: readerId } // Remove from receivedBy if present
                }
            );

            // Notify participants about the thread update
            if (msgs.modifiedCount > 0) {
                thread.participants.forEach(participant => {
                    if (!participant.equals(readerId)) {
                        // @ts-ignore
                        io.to(participant.toString()).emit('message-thread-read', { thread, readerId });
                    }
                });
            }

        } catch (error) {
            console.error('Message error:', error);
        }
    }

    // Mark single message as read
    async markMessageAsRead(data: { messageId: string, readerId: string }) {
        try {
            const { messageId, readerId } = data;

            // Update the message's readBy field
            const message = await Message.findOneAndUpdate(
                {
                    _id: messageId,
                    readBy: { $ne: readerId }
                },
                {
                    $addToSet: { readBy: readerId },
                    $pull: { receivedBy: readerId }
                },
                { new: true }
            );
            if (!message) {
                // @ts-ignore
                io.to(readerId).emit('message-read-error', data); // Notify sender of error
                logger.error(colors.red(`Message with ID ${messageId} not found`));
                return
            }
            // @ts-ignore
            io.to(message.senderId?.toString()).emit('message-read', message); // Notify the sender


            // update unread count in the thread
            const thread = await MessageThread.findById(message.threadId);
            if (!thread) throw new Error('Thread not found');

            const unread = thread.unreadCount.get(new Types.ObjectId(readerId)) || 0;
            thread.unreadCount.set(new Types.ObjectId(readerId), Math.max(unread - 1, 0));
            await thread.save();
        } catch (error) {
            console.error('Message error:', error);
        }
    }

    async markMessageAsDelivered(data: { messageId: string, receiverId: string, }) {
        try {
            const { messageId, receiverId } = data;

            const message = await Message.findOneAndUpdate(
                {
                    _id: messageId,
                    receivedBy: { $ne: receiverId },
                    readBy: { $ne: receiverId }
                },
                { $addToSet: { receivedBy: receiverId } },
                { new: true }
            );

            if (!message) {
                // @ts-ignore
                io.to(receiverId).emit('message-delivered-error', data); // Notify sender of error
                logger.error(colors.red(`Message with ID ${messageId} not found`));
                return
            }

            // @ts-ignore
            io.to(message.senderId?.toString()).emit('message-delivered', message); // Notify the sender

        } catch (error) {
            console.error('Message error:', error);
        }
    }


}

export const MessageService = new service();