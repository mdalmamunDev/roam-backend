import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { JobProcessService } from './job processes.service';
import haversine from 'haversine-distance';
import JobProcess from './job processes.model';
import IJobProcess, { IJobProcessStatus, JobProcessStatus, JobProcessStatusDone, JobProcessStatusHistoryCustomer, JobProcessStatusHistoryProvider, StatusMap } from './job processes.interface';
import Job from '../jobs/jobs.model';
import paginate from '../../helpers/paginationHelper';
import { NotificationService } from '../notification/notification.services';
import { INotification } from '../notification/notification.interface';
import { config } from '../../config';
import ApiError from '../../errors/ApiError';
import { MechanicService } from '../mechanic/mechanic.service';
import { Role, TUserPlatform } from '../user/user.constant';
import { UserService } from '../user/user.service';
import { IJobStatus } from '../jobs/jobs.interface';
import { SettingService } from '../settings/settings.service';
import TowTruck from '../tow truck/tow truck.model';
import { getDistanceInMiles } from '../../helpers/globalHelper';


// get all with pagination
const getAll = catchAsync(async (req, res) => {
  const userId = req.user?.userId; // Get the logged-in user's ID
  const { role } = req.params; // Extract role from the auth object
  if (role !== 'customer' && role !== 'provider') {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Invalid role provided' });
  }

  const { page = 1, limit = 10, sortField = 'updatedAt', sortOrder = 'desc', status, nextStatus } = req.query; // TODO: sort not working

  // Extract filters from query params
  let filters: any = {};
  if (role === 'customer') {
    filters.customerId = userId; // Filter by customer ID
  } else if (role === 'provider') {
    filters.providerId = userId; // Filter by provider ID
  }

  // Auto-trigger events to update job statuses
  await JobProcessService.autoUpdateStatuses({ filters, oldStatus: 'requested', newStatus: 'rejected', delay: config.jobProcess.autoRejectRequestedDelay })
  await JobProcessService.autoUpdateStatuses({ filters, oldStatus: 'serviced', newStatus: 'service-rejected', delay: config.jobProcess.autoRejectServicedDelay })

  if (status) {
    filters.status = status === 'history'
      ? { $in: role === 'customer' ? JobProcessStatusHistoryCustomer : JobProcessStatusHistoryProvider }
      : { $in: nextStatus ? [status, nextStatus] : [status] };
  }

  // Call the paginate function with required parameters
  let { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: JobProcess,
    populate: [
      { path: 'providerId', select: 'name profileImage address location role' },
      { path: 'customerId', select: 'name address profileImage location' },
      {
        path: 'jobId',
        select: 'carModelId platform',
        populate: { path: 'carModelId', select: 'name' }
      }
    ]
  });

  if (role === 'customer') {
    await Promise.all(results.map(async (result: any, index: number) => {
        const additionalData = await JobProcessService.getProviderAdditional(req, result.providerId);
        if(additionalData) {
        results[index] = {
          ...result._doc, // Spread the document to maintain other fields
          providerId: {
            ...result.providerId._doc, // Spread the providerId fields
            ...additionalData,
          },
        };
      }
    }));
  }

  const setting = await SettingService.get('transport-price');
  const transportPrice = setting?.value || 0; // Fallback to 0 if not set

  let results2 = await results.map((r: any) => {
    const obj = JSON.parse(JSON.stringify(r));
    if (role === 'customer') {
      obj.customerId = undefined;
      if (r.providerId?.location) obj.providerId.location = r.providerId.location.coordinates;
      if (status === 'requested' as IJobProcessStatus) {
        obj.transportPrice = r?.jobId?.platform === 'on site' as TUserPlatform
          ? transportPrice
          : 0;
      }
    } else if (role === 'provider') {
      obj.providerId = undefined;
      if (r.customerId?.location) obj.customerId.location = r.customerId.location.coordinates;
    }

    obj.carModel = r.jobId?.carModelId?.name || 'N/A'; // Dummy data for testing
    obj.platform = r.jobId?.platform;
    obj.jobId = undefined; // If you need to remove jobId, you can uncomment this
    return obj; // Return the modified object
  });

  // Send the response with the results and pagination info
  return sendResponse(res, { code: StatusCodes.OK, message: 'Job processes retrieved successfully', data: results2, pagination });
});

// get one
const getOne = catchAsync(async (req, res) => {
  const userId = req.user?.userId; // Get the logged-in user's ID

  if (!userId) {
    return sendResponse(res, {
      code: StatusCodes.UNAUTHORIZED,
      message: 'Unauthorized',
    });
  }

  const { role, id } = req.params; // Extract role from the auth object
  if (role !== 'customer' && role !== 'provider') {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Invalid role provided',
    });
  }
  if (!id) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'ID is required' });
  }

  const filter: any = { _id: id };
  if (role === 'customer') {
    filter.customerId = userId; // Filter by customer ID
  } else if (role === 'provider') {
    filter.providerId = userId; // Filter by provider ID
  }

  const result = await JobProcessService.getOneByFilter(filter); // Fetch job process by ID

  if (!result) {
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Job process not found' });
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Job process retrieved successfully', data: result });
});





// Create a new job process
const create = catchAsync(async (req, res) => {
  const auth = req.user;
  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access');
  }

  const payload = req.body as IJobProcess;
  payload.providerId = auth.userId; // Set providerId based on logged-in user

  // Check if the job process already exists
  const existingJobProcess = await JobProcess.findOne({
    jobId: payload.jobId,
    providerId: payload.providerId,
  });
  if (existingJobProcess) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'You already requested this job.' });
  }

  // get customer id & update targets of job
  const job = await Job.findOneAndUpdate(
    { _id: payload.jobId, status: 'active' as IJobStatus, targets: auth.userId, isDeleted: false },
    { $pull: { targets: auth.userId } },
    { new: true }
  );
  if (!job) {
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'The requested job is not available at the moment. Please try again later or choose a different job.' });
  }
  payload.customerId = job.customerId;


  // add service price on payload
  if (auth.role === 'tow_truck') {
    const tow_truck = await TowTruck.findOne({ userId: auth.userId }).select('ppm');
    if (!tow_truck) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: 'You are not a tow truck provider.',
      });
    }

    if (!job.location || !job.destination) {
      return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Job location or destination is missing.' });
    }

    payload.servicePrice = getDistanceInMiles(job.location.coordinates, job.destination.coordinates) * (tow_truck.ppm || 1);
  }

  const result = await JobProcess.create(payload); // Create a new job process
  if (!result) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to request this job' });
  }
  sendResponse(res, { code: StatusCodes.CREATED, message: 'Requested job successfully', data: result });
  // make notification
  NotificationService.addNotification({ receiverId: payload.customerId, title: 'Request Job!', message: 'A provider request your job.' })
});


export const updateStatus = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const { role } = req.params; // Must be either 'customer' or 'provider'
  const { status } = req.body;

  console.log(status);

  if (
    !userId
    || !role
    || !['customer', 'provider'].includes(role)
    || !JobProcessService.getRoleStatus(role)?.includes(status) // check have him this status permission
  ) {
    return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'Unauthorized access' });
  }

  const { id } = req.params;

  if (!id || !status || !JobProcessStatus.includes(status))
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Invalid ID or status' });

  const roleField = role === 'customer' ? 'customerId' : 'providerId';

  const query = { _id: id, [roleField]: userId };
  // get required prev status
  const preStatus = StatusMap[status as IJobProcessStatus]
  if (preStatus) query.status = { $in: preStatus };

  const result = await JobProcessService.updateJobProcess(query, { status });

  if (!result)
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Job process not found' });

  sendResponse(res, { code: StatusCodes.OK, message: 'Job process status updated successfully', data: result });

  // Update job status based on process status
  const jobStatusMap: Record<string, IJobStatus> = { accepted: 'process', paid: 'completed', denied: 'active' };
  const newJobStatus = jobStatusMap[status];
  if (newJobStatus) {
    await Job.findByIdAndUpdate(result.jobId, { status: newJobStatus });
  }

  // Create notification
  const receiver = role === 'customer' ? result.providerId : result.customerId;
  const senderName = req.user?.name;
  if (receiver?._id) {
    await NotificationService.addNotification({
      receiverId: receiver._id,
      title: 'Job Process Update',
      message: `${senderName} has ${status} the job process`,
    } as Partial<INotification>);
  }
});

// Add services to a job process by provider
const providerAddServices = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract job process ID from params
  const payload = req.body; // Get the services to be added
  const { userId } = req.user;
  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You aren\'t authorized.');
  }

  const servicePrice = Array.isArray(payload)
    ? payload.reduce((sum, item) => sum + (item.amount || 0), 0)
    : 0;


  const preStatus = StatusMap['serviced' as IJobProcessStatus]
  const query = { _id: id, providerId: userId, status: { $in: preStatus } };

  const result = await JobProcessService.updateJobProcess(query, { services: payload, servicePrice, status: 'serviced' });

  if (!result) {
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Job process not found' });
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Services added successfully', data: result });


  // Create notification
  if (result.customerId) {
    await NotificationService.addNotification({
      receiverId: result.customerId._id,
      title: 'Job Process Update',
      message: `${(result.providerId as any)?.name || "Provider"} has added services`,
    } as Partial<INotification>);
  }
});

const customerLeaveFeedback = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract job process ID from params
  const { rating, comment } = req.body; // Get the services to be added
  const { userId } = req.user;
  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You aren\'t authorized.');
  }

  const result = await JobProcessService.updateJobProcess({ _id: id, customerId: userId, status: { $in: JobProcessStatusDone } }, { rating, comment });

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Job process not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Given feedback successfully',
    data: result,
  });

  // Create notification
  if (result.providerId) {
    await NotificationService.addNotification({
      receiverId: result.providerId._id,
      title: 'Job Process Update',
      message: `${(result.customerId as any)?.name || "Unknown"} has given feedback`,
    } as Partial<INotification>);
  }
});

export const jobProcessController = {
  getAll,
  getOne,
  create,
  updateStatus,
  providerAddServices,
  customerLeaveFeedback,

};
