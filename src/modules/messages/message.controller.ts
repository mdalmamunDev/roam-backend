import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { MessageService } from './message.service';
import MessageThread from './messageThread.model';
import paginate from '../../helpers/paginationHelper';
import Message from './messages.model';
import { User } from '../user/user.model';
import { onlineUsers } from '../../helpers/socket';
import mongoose from 'mongoose';


const getAll = catchAsync(async (req, res) => {
    const receiverId = req.params?.receiverId;
    const userId = req.user?.userId;
    if (!receiverId || !userId) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong!', data: null });

    const receiver = await User.findById(receiverId);
    if (!receiver) {
        return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Receiver not found', data: null });
    }

    let thread = await MessageThread.findOne({
        participants: { $all: [userId, receiverId] },
    });

    if (!thread) {
        thread = await MessageThread.create({
            participants: [userId, receiverId],
            unreadCount: new Map([[userId, 0], [receiverId, 0]]),
        });
    }
    if (!thread) {
        return sendResponse(res, { code: StatusCodes.INTERNAL_SERVER_ERROR, message: 'No messages found for this thread' });
    }

    const threadId = thread._id;
    const {
        page = 1,
        limit = 10,
        sortField = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: { threadId },
        sortField: sortField as string,
        sortOrder: sortOrder as string,
        model: Message,
    });

    if(results.length === 0) {
        return sendResponse(res, { 
            code: StatusCodes.NOT_FOUND, 
            message: 'No messages found for this thread',
            data: [{
                "_id": "68347217b723f8f5a5dea1fa",
                "senderId": "682ddfd385db26279b5c2198",
                "threadId": threadId,
                "content": "Get Started                 68347217b723f8f5a5dea1fa",
                "attachments": [],
                "receivedBy": [],
                "readBy": [],
                "createdAt": "2025-05-26T13:52:23.361Z",
                "updatedAt": "2025-05-26T13:52:23.361Z",
                "__v": 0
            }]
        });
    }
    // Send the response with the results and pagination info
    sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Messages retrieved successfully',
        data: results,
        pagination,
    });

    if (page.toString() === '1') MessageService.markThreadAsRead(threadId, userId);
});

const getAllThreads = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong!', data: null });

    const {
        page = 1,
        limit = 10,
        sortField = 'updatedAt',
        sortOrder = 'desc',
    } = req.query;

    // Extract filters from query params
    const filters: any = {
        participants: userId,
    };

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters,
        sortField: sortField as string,
        sortOrder: sortOrder as string,
        model: MessageThread,
        populate: [
            { path: 'participants', select: 'name profileImage' },
            { path: 'lastMessageId', select: 'content createdAt' }
        ],
    });


    const results2 = results.map((thread: any) => {
        const lastMessage = thread.lastMessageId;
        const obj = {...thread.toObject()};
        obj.unreadCount = thread.unreadCount.get(userId) || 0;
        obj.lastMessage = lastMessage ? {
            content: lastMessage.content,
            attachments: lastMessage.attachments,
            createdAt: lastMessage.createdAt,
        } : null;
        // Remove the current user from participants to get the receiver
        const [receiver] = thread.participants?.filter((p: any) => p._id.toString() !== userId) || [];
        obj.receiver = receiver
            ? { ...receiver.toObject?.(), isOnline: onlineUsers.has(receiver._id.toString()) }
            : { _id: null, name: 'Unknown', profileImage: null, isOnline: false };
        obj.participants = undefined;
        obj.lastMessageId = undefined;
        return obj;
    });


    sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Threads retrieved successfully',
        data: results2,
        pagination,
    });
});

const searchThreads = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Something went wrong!',
      data: null,
    });
  }

  const { keyword } = req.query;

  const threads = await MessageThread.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participants',
      },
    },
    {
      $match: {
        'participants.name': {
          $regex: keyword as string,
          $options: 'i',
        },
      },
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'lastMessageId',
        foreignField: '_id',
        as: 'lastMessageId',
      },
    },
    {
      $unwind: {
        path: '$lastMessageId',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  const formattedThreads = threads.map((thread: any) => {
    const lastMessage = thread.lastMessageId;
    const obj = { ...thread };

    obj.unreadCount = thread.unreadCount?.[userId] || 0;

    obj.lastMessage = lastMessage
      ? {
          content: lastMessage.content,
          attachments: lastMessage.attachments,
          createdAt: lastMessage.createdAt,
        }
      : null;

    // Remove the current user to get the receiver
    const [receiver] =
      thread.participants?.filter((p: any) => p._id.toString() !== userId) || [];

    obj.receiver = receiver
      ? {
          _id: receiver._id,
          name: receiver.name,
          profileImage: receiver.profileImage,
          isOnline: onlineUsers.has(receiver._id.toString()),
        }
      : {
          _id: null,
          name: 'Unknown',
          profileImage: null,
          isOnline: false,
        };

    delete obj.participants;
    delete obj.lastMessageId;

    return obj;
  });

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Threads retrieved successfully',
    data: formattedThreads,
  });
});

const markThreadAsRead = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    const { threadId } = req.params;
    if (!threadId || !userId) return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong!', data: null });

    await MessageService.markThreadAsRead(threadId, userId);

    sendResponse(res, {
        code: StatusCodes.OK,
        message: 'Thread marked as read successfully',
        data: null,
    });
});

export const MessageController = {
    getAll,
    getAllThreads,
    searchThreads,
    markThreadAsRead,
};
