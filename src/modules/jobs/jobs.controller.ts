import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Job from './jobs.model';
import { NotificationService } from '../notification/notification.services';
import ApiError from '../../errors/ApiError';
import paginate from '../../helpers/paginationHelper';
import IJob, { IJobStatus, JobStatus } from './jobs.interface';
import { User } from '../user/user.model';
import TowTruck from '../tow truck/tow truck.model';
import { UserService } from '../user/user.service';
import ITowType from '../tow type/tow type.interface';
import Promo from '../promo/promo.model';
import Transaction from '../payment/transaction/transaction.model';

// create a new job
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const payload : IJob = req.body;
  payload.userId = auth.userId;
  let { coordinates, destCoordinates } = req.body;

  if (!coordinates) {
    coordinates = auth?.location?.coordinates;
  }

  if (!coordinates) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Please turn on your location');
  }

  payload.fromLocation = {
    type: 'Point',
    coordinates, // [longitude, latitude]
  };

  if (destCoordinates) {
    payload.toLocation = {
      type: 'Point',
      coordinates: destCoordinates, // [longitude, latitude]
    };
  }

  const result = await Job.create(payload);

  if (!result) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to create job', });
  }

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Job created successfully', data: result, });
});

// book provider & init transaction
const book = catchAsync(async (req, res) => {
  const auth = req.user;

  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const {jobId, providerId, promoId} = req.body;

  const [providerU, towTruck] = await Promise.all([
    UserService.getSingleUser(providerId),
    TowTruck.findOne({ userId: providerId }).populate('towTypeId').lean()
  ]);

  if (!providerU || !towTruck?.towTypeId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Provider not found or He didn\'t set tow type yet.');
  }

  // set this provider on job
  const job = await Job.findOneAndUpdate(
    {_id: jobId, status: 'created', providerId: null, userId: auth.userId}, 
    { providerId, status: 'requested' as IJobStatus }, 
    { new: true }
  ) 
  || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found or already booked'); })();


  // calculate the price
  const { baseFare, perKM, charge } = towTruck.towTypeId as Partial<ITowType>;
  const promo = await Promo.findOneAndUpdate(
    {
      _id: promoId,
      users: { $ne: auth.userId },
      expireDate: { $gte: new Date() },
      status: 'active'
    },
    {
      $push: { users: auth.userId }
    },
    { new: true }
  )
  if(!promo || !baseFare || !perKM || !charge) throw new ApiError(StatusCodes.NOT_FOUND, 'Prices or promo not found');

  const orderAmount = baseFare + perKM * job.distance;
  const discount = promo.type === 'percent' ? orderAmount * (promo.value / 100) : promo.value;
  
  const finalAmount = orderAmount - discount + charge;

  // create transaction but not pay now
  await Transaction.create({
    userId: auth.userId,
    providerId,
    jobId,
    amount: orderAmount,
    discount,
    charge,
    finalAmount,
    status: 'created'
  })
  || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction creation error'); })();



  sendResponse(res, { code: StatusCodes.CREATED, message: 'Job created successfully', data: 0, });
});

const cancelTrip = catchAsync(async (req, res) => {
  const auth = req.user;

  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const {id} = req.params;

  // set
  const job = await Job.findOneAndUpdate(
    { _id: id, status: { $in: ['requested', 'accepted'] }, userId: auth.userId }, // Fixed $in syntax
    { providerId: null, status: 'created' as IJobStatus },
    { new: true }
  )
  || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found or already in progress'); })();

  // make notification
  await NotificationService.addNotification({receiverId: job.providerId, title: 'Trip canceled', message: `${auth.name} have canceled the trip`});

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Job created successfully', data: 0, });
});

const acceptTrip = catchAsync(async (req, res) => {
  const auth = req.user;

  if (!auth) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
  }

  const {id} = req.params;

  // set
  const job = await Job.findOneAndUpdate(
    { _id: id, status: 'requested', providerId: auth.userId }, // Fixed $in syntax
    { providerId: null, status: 'accepted' as IJobStatus },
    { new: true }
  )
  || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found or already in progress'); })();

  // make notification
  await NotificationService.addNotification({receiverId: job.userId, title: 'Trip accepted', message: `Provider have accepted the trip`});

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Job created successfully', data: 0, });
});


export const jobController = {
  create,
  book,
  cancelTrip,
  acceptTrip,
};
