import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.services';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import paginate from '../../helpers/paginationHelper';
import { Notification } from './notification.model';

const getALLNotification = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const userId = req.user.userId;

  // Extract filters from query params
  let filters: any = { receiverId: userId };

  // Call the paginate function with required parameters
  const { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: Notification,
  });

  // Send the response with the results and pagination info
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Notifications retrieved successfully',
    data: results,
    pagination,
  });

  await NotificationService.makeNotificationSeen(userId);
});

const getUnseenNotificationCount = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const data = await NotificationService.getUnseenNotificationCount(userId);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: data,
    message: 'Unseen notifications count',
  });
});

export const NotificationController = {
  getALLNotification,
  getUnseenNotificationCount,
};
