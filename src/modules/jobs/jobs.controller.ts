import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Job from './jobs.model';
import { NotificationService } from '../notification/notification.services';
import ApiError from '../../errors/ApiError';
import paginate from '../../helpers/paginationHelper';
import IJob, { IJobStatus, JobStatus } from './jobs.interface';
import { User } from '../user/user.model';
import { getAddressFromCoordinates, getDistanceInMiles } from '../../helpers/globalHelper';
import JobProcess from '../Job processes/job processes.model';
import { JobProcessStatusDone, JobProcessStatusFinal } from '../Job processes/job processes.interface';
import { JobProcessService } from '../Job processes/job processes.service';

// get all active jobs by customer
const getAllForCustomer = catchAsync(async (req, res) => {
  const customerId = req.user?.userId;
  if (!customerId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status } = req.query;
  if (status && !JobStatus.includes(status as IJobStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Status');
  }

  let filters: any = { isDeleted: false, customerId }; // Ensure we only get non-deleted jobs
  if (status) filters.status = status;

  const { results, pagination } = await paginate({ page: parseInt(page as string), limit: parseInt(limit as string), filters, sortField: sortField as string, sortOrder: sortOrder as string, model: Job, select: 'carModelId platform createdAt status location destination', populate: [{ path: 'carModelId', select: 'name' }], });


  // For each job, fetch the related JobProcess with status 'done'
  const customRes = await Promise.all(
    results.map(async (item: any) => {
      const obj: any = item.toObject ? item.toObject() : { ...item };
      obj.status = item.status;

      // Find the last final job process
      const jp: any = await JobProcess.findOne({ jobId: item._id, status: JobProcessStatusFinal }).populate('providerId', 'name profileImage address location role').sort({ createdAt: -1 });

      if(jp) {
        const additionalData = await JobProcessService.getProviderAdditional(req, jp?.providerId);
        if(additionalData) {
          obj.provider = {...jp?.providerId._doc, ...additionalData};
        }

        obj.processStatus = jp.status;
      }

      if(obj.destination) {
        obj.destAddress = await getAddressFromCoordinates(obj.destination?.coordinates)
        obj.totalDistance = getDistanceInMiles(obj.location?.coordinates, obj.destination?.coordinates)?.toFixed(2)
      }
      obj.address = await getAddressFromCoordinates(obj.location?.coordinates)
      obj.location = undefined;
      obj.destination = undefined;

      return obj;
    })
  );
  // Replace results with customRes for the response
  results.splice(0, results.length, ...customRes);

  sendResponse(res, { code: StatusCodes.OK, message: 'Jobs retrieved successfully', data: results, pagination });
});

const getAllAToZ = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, } = req.query;
  if (status && !JobStatus.includes(status as IJobStatus)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Status');
  }
  const filters: any = {}; // Ensure we only get non-deleted jobs
  if (status) filters.status = status;

  const { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: Job,
    select: 'carModelId platform status createdAt isDeleted',
    populate: [{ path: 'carModelId', select: 'name' }, { path: 'customerId', select: 'name' }],
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Jobs retrieved successfully', data: results, pagination });
});

const getAllProvider = catchAsync(async (req, res) => {
  const { radius } = req.params;
  if (!radius) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Radius is required' });
  }

  const coordinates = req.user?.location?.coordinates;
  if (!coordinates) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Please turn on your location' });
  }

  const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

  let filters: any = { isDeleted: false, status: 'active' };
  const earthRadiusInMiles = 3963.2;
  filters.location = {
    $geoWithin: {
      $centerSphere: [coordinates, Number(radius) / earthRadiusInMiles], // Convert radius to radians
    },
  };
  filters.targets = { $in: [req.user.userId] }; // Only where current provider is present in targets

  const { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: Job,
    select: 'customerId carModelId platform createdAt location destination',
    populate: [
      { path: 'customerId', select: 'name profileImage' },
      { path: 'carModelId', select: 'name' },
    ],
  });


  const results2 = results.map((item: any) => {
    const distance = getDistanceInMiles(item.location.coordinates, item.destination.coordinates);
    const obj = item.toObject();
    if(distance) obj.distance = distance;
    return obj;
  })

  sendResponse(res, { code: StatusCodes.OK, message: 'Jobs retrieved successfully', data: results2, pagination });
});


// get a job by ID and where isDeleted is false
const getById = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract job ID from params

  // Find the job by ID and check if it's not deleted
  const result = await Job.findOne({
    _id: id,
    isDeleted: false,
    status: 'active',
  })
    .populate('carModelId') // This fetches the associated CarModel
    .populate('customerId') // Optional: also fetch customer details
    .select('-isDeleted -status') // Exclude isDeleted and status fields from the result
    .exec();

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Job not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Job retrieved successfully',
    data: result,
  });
});

// create a new job
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const payload = req.body;
  payload.customerId = auth.userId;
  let { coordinates, destCoordinates } = req.body;

  if (!coordinates) {
    coordinates = auth?.location?.coordinates;
  }

  if (!coordinates) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please turn on your location');
  }

  payload.location = {
    type: 'Point',
    coordinates, // [longitude, latitude]
  };

  if (destCoordinates) {
    payload.destination = {
      type: 'Point',
      coordinates: destCoordinates, // [longitude, latitude]
    };
  }

  const result = await Job.create(payload);

  if (!result) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to create job', });
  }

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Job created successfully', data: result, });

  // make notifications
  result.targets.forEach(target => {
    NotificationService.addNotification({ receiverId: target, title: 'New job!', message: 'A customer targets you.' });
  });
});

// update an existing job by ID
const update = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract job ID from params
  const payload = req.body;

  // Find the job by ID and update it
  const result = await Job.findOneAndUpdate(
    { _id: id, customerId: req.user.userId },
    payload,
    { new: true }
  )
    .populate('carModelId') // This fetches the associated CarModel
    .populate('customerId'); // Optional: also fetch customer details

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Job not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Job updated successfully',
    data: result,
  });
});

// delete a job by ID
const trash = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract job ID from params

  // Find and update status
  const result = await Job.findOneAndUpdate(
    { _id: id, customerId: req.user.userId },
    { isDeleted: true },
    { new: true }
  )
    .populate('carModelId') // This fetches the associated CarModel
    .populate('customerId'); // Optional: also fetch customer details

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Job deleted successfully',
    data: result,
  });
});

export const jobController = {
  getAllForCustomer,
  getAllAToZ,
  getAllProvider,
  getById,
  create,
  update,
  trash,
};
