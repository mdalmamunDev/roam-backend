import { Server, Socket } from 'socket.io';
import colors from 'colors';
import { logger } from '../shared/logger';
import { MessageService } from '../modules/messages/message.service';
import { UserService } from '../modules/user/user.service';
import { NotificationService } from '../modules/notification/notification.services';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}

export let onlineUsers = new Set();

const socket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(colors.blue(`🔌🟢 A user connected: ${socket.id}`));

    // Handle user connecting and joining their room
    socket.on('user-connected', ({ userId, fcmToken }: { userId: string; fcmToken: string }) => {
      socket.userId = userId;
      socket.join(userId); // Join the room for the specific user
      onlineUsers.add(userId); // Add user to the online users set
      logger.info(colors.green(`User ${userId} joined their notification room`));
      NotificationService.sendAllUnseenNotificationTo(userId, fcmToken);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(socket.userId); // Remove user from the online users map
      logger.info(colors.red('🔌🔴 A user disconnected'));
    });



    /** Handle user status check
     *  check-user-status: Triggered when a user checks the status of another user. The server:
     *   - Emits the online status of the user to the requesting socket.
     * 
     * user-status: Triggered when a user checks the status of another user. The server:
     *  - Emits the online status of the user to the requesting socket.
     * 
     * */
    socket.on('check-user-status', (userId: string) => {
      socket.emit('user-status', { userId, online: onlineUsers.has(userId) });
    });



    /** Handle live location sharing
     *  location-share: Triggered when a user shares their location. The server:
     *    - Updates the user's location in the database.
     *    - Retrieves the IDs of users to share the location with.
     *    - Emits the location to the users in the room.
     * 
     *  location-receive: Triggered when a user receives a location update. The server:
     *    - Emits the location to the user's room.
     * */
    socket.on('location-share', async (data) => {
      UserService.updateUserLocation(data); // Update user's location in the database
    });




    /**
     * # Message Handling Events
     *
     * - **message-send**: Triggered when a user sends a message. The server:
     *    - Saves the message to the database.
     *    - Notifies the sender of the failure if saving fails.
     *    - Emits the message to the receiver's room.
     *
     * - **message-send-error**: Triggered when there is an error saving the message to the database. The server:
     *    - Notifies the sender of the failure.
     *
     * - **message-receive**: Triggered when a message is successfully sent. The server:
     *    - Emits the message to the receiver's room.
     *
     * - **message-received**: (on) receiving a message, the server:
     *   - Updates the message status in the database.
     *   - Notifies the sender of the delivered status.
     *
     * - **message-read**: (on) when a user reads a message. The server:
     *    - Updates the message status in the database.
     *    - Notifies the sender of the read status.
     *
     * - **message-read**: (emit) when a user reads a message. The server:
     *    - notifies the sender of the read status.
     *
     * - **message-read-error**: Triggered when there is an error updating the message status in the database. The server:
     *    - Notifies the sender of the failure.* 
     *
     * - **message-thread-read**: Triggered when a user reads all from a thread. The server:
     *    - Updates the message status in the database.
     *    - Notifies the sender of the read status.
     *
     * - **message-delivered**: Triggered when a user received a message. The server:
     *    - Updates the message status in the database.
     *   - Notifies the sender of the delivered status.
     *    - Notifies the sender of the read status.
     *
     * - **message-delivered-error**:
     * 
     * 
     * message-send | message-send-error* => message-receive => message-received => message-delivered | message-delivered-error => message-read | message-read-error
     */
    socket.on('message-send', async (data) => {
      await MessageService.sendMessage(data);;  // Save message to database
    });

    // Handle message read update
    socket.on('message-received', async (data) => {
      await MessageService.markMessageAsDelivered(data); // delivered message to the sender
    });

    // Handle message read update
    socket.on('message-read', async (data) => {
      await MessageService.markMessageAsRead(data);
    });
  });
};

export const socketHelper = { socket };
