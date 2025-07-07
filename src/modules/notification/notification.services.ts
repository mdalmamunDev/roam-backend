import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { User } from '../user/user.model';
import { Types } from 'mongoose';
import { logger } from '../../shared/logger';
import colors from 'colors';
import admin from '../../helpers/admin.firebase';
import { FcmTokenService } from '../fcm token/fcm token.service';

const sendAllUnseenNotificationTo = async (receiverId: string, fcmToken: string) => {

  try {
    if (!Types.ObjectId.isValid(receiverId)) {
      console.log('receiverId is invalid for notification ');
      return;
    }


    // const notifications = await Notification.find({ receiverId, viewStatus: false });
    // if (notifications?.length) {
    //   notifications.forEach(async (notification) => {
    //     // @ts-ignore
    //     // io.to(receiverId).emit('notification', notification);
    //     const message = {
    //       notification: {
    //         title: notification.title,
    //         body: notification.message,
    //       },
    //       token: fcmToken,
    //     };

    //     const response = await admin.messaging().send(message);
    //     logger.info(colors.green(`🔔 All[${notifications.length}] unseen notifications are send.`));

    //     return response; // message ID
    //   });
    // }


    // store/update the fcm token
    await FcmTokenService.store(fcmToken, receiverId)
  } catch (error) {
    console.error('FCM error:', error);
  }
};

const sendNotification = async (notification: INotification) => {
  if (notification?.receiverId) {
    // @ts-ignore
    io.to(notification.receiverId.toString()).emit('notification', notification);
    try {
      const deviceToken = await FcmTokenService.getToken(notification.receiverId?.toString());
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      return response; // message ID
    } catch (error) {
      console.error('FCM error:', error);
    }
  } else {
    // @ts-ignore
    io.emit(`notification`, notification);
  }
};
const addNotification = async (
  payload: Partial<INotification>
): Promise<INotification> => {
  // Save the notification to the database
  const result = await Notification.create(payload);

  sendNotification(result);

  return result;
};

const sendNotificationToSuperAdmin = async (body: Partial<INotification>) => {
  const userId = await User.findOne({
    role: 'admin',
  }).select('_id');
  const data: Partial<INotification> = { ...body, receiverId: userId?.id };

  await addNotification(data);
};

const makeNotificationSeen = async (userId: string) => {
  return await Notification.findOneAndUpdate(
    { receiverId: userId },
    { viewStatus: true }
  );
};

const getUnseenNotificationCount = async (userId: string) => {
  const unSeenNotificationCount = await Notification.countDocuments({
    receiverId: userId,
    viewStatus: false,
    // isDeleted: false,
  });
  return unSeenNotificationCount;
};

export const NotificationService = {
  sendAllUnseenNotificationTo,
  addNotification,
  sendNotificationToSuperAdmin,
  makeNotificationSeen,
  getUnseenNotificationCount,
};
