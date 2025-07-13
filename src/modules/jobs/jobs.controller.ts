import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Job from './jobs.model';
import { NotificationService } from '../notification/notification.services';
import ApiError from '../../errors/ApiError';
import IJob, { IJobStatus } from './jobs.interface';
import Transaction from '../payment/transaction/transaction.model';
import { TowTruckService } from '../tow truck/tow truck.service';
import { getAddressFromCoordinates } from '../../helpers/globalHelper';
import { PromoService } from '../promo/promo.service';
import { TowTypeService } from '../tow type/tow type.service';
import { startSession } from 'mongoose';
import paginate from '../../helpers/paginationHelper';

class Controller {
// get on going trips
  getOnGoingForUser = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, sortField = 'updatedAt', sortOrder = 'desc'} = req.query;

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters: {
        userId: req.user?.userId,
        status: { $ne: 'completed' }, // Fetch jobs not completed
      },
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Job,
    });

    const resResult = await Promise.all(
      results.map(async (j: IJob) => {
        const { name: providerName, companyName, description, carImage } = await TowTruckService.getValidProvider(j.providerId);

        const [fromAddress, toAddress] = await Promise.all([
          getAddressFromCoordinates(j.fromLocation?.coordinates),
          getAddressFromCoordinates(j.toLocation?.coordinates),
        ]);

        return { jobId: j._id, providerName, companyName, description, fromAddress, toAddress, carImage, status: j.status };
      })
    );

    sendResponse(res, { code: StatusCodes.OK, data: resResult, pagination });
  });

  getHistoryForUser = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, sortField = 'updatedAt', sortOrder = 'desc'} = req.query;

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters: {
        userId: req.user?.userId,
        status: 'completed', // Fetch jobs not completed
      },
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Job,
    });

    const resResult = await Promise.all(
      results.map(async (j: IJob) => {
        const { name: providerName, companyName, description, driverImage } = await TowTruckService.getValidProvider(j.providerId);

        const [fromAddress, toAddress] = await Promise.all([
          getAddressFromCoordinates(j.fromLocation?.coordinates),
          getAddressFromCoordinates(j.toLocation?.coordinates),
        ]);

        return { jobId: j._id, providerId: j.providerId, providerName, companyName, description, fromAddress, toAddress, driverImage, rating: j.rating };
      })
    );

    sendResponse(res, { code: StatusCodes.OK, data: resResult, pagination });
  });

  getRequestedForProvider = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, sortField = 'updatedAt', sortOrder = 'desc'} = req.query;

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters: {
        providerId: req.user?.userId,
        status: 'accepted', // Fetch jobs not completed
      },
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Job,
    });

    const resResult = await Promise.all(
      results.map(async (j: IJob) => {
        const { name: providerName, companyName, description, driverImage } = await TowTruckService.getValidProvider(j.providerId);

        const [fromAddress, toAddress] = await Promise.all([
          getAddressFromCoordinates(j.fromLocation?.coordinates),
          getAddressFromCoordinates(j.toLocation?.coordinates),
        ]);

        return { jobId: j._id, providerId: j.providerId, providerName, companyName, description, fromAddress, toAddress, driverImage, rating: j.rating };
      })
    );

    sendResponse(res, { code: StatusCodes.OK, data: resResult, pagination });
  });

  // create a new job
  create = catchAsync(async (req, res) => {
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
      return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Failed to create trip', });
    }

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Trip created successfully', data: result, });
  });

  detailsPre = catchAsync(async (req, res) => {
    const {jobId, providerId} = req.params;

    const job = await Job.findOne({_id: jobId, userId: req.user?.userId}).lean();
    if (!job) return sendResponse(res, { code: StatusCodes.UNAUTHORIZED, message: 'Trip not found or unauthorized access' });
    
    const provider = await TowTruckService.getValidProviderOrThrow(providerId);
    
    const [fromAddress, toAddress, promos] = await Promise.all([
      getAddressFromCoordinates(job.fromLocation?.coordinates),
      getAddressFromCoordinates(job.toLocation?.coordinates),
      PromoService.getValidPromosByUser(req.user?.userId),
    ]);


    let amount, charge, discount, finalAmount;
    const transaction = await Transaction.findOne({ jobId: job._id });
    if (transaction) {
      amount = transaction.amount;
      charge = transaction.charge;
      discount = transaction.discount;
      finalAmount = transaction.finalAmount;
    } else {
      ({ amount, charge, discount, finalAmount } = await TowTypeService.calculatePrices(
        provider.towTypeId,
        job.distance,
        '',
        req.user?.userId
      ));
    }

    const resResult = {
      jobId: job._id,
      providerId: provider.userId,
      providerName: provider.name,
      companyName: provider.companyName,
      towType: provider.towTypeId?.name,
      description: provider.description,
      rating: provider.rating,
      totalRating: provider.totalRating,
      isVerified: provider.isVerified,
      fromAddress,
      toAddress,
      promos,
      distance: job.distance,
      amount,
      charge,
      discount,
      finalAmount,
    };

    sendResponse(res, { code: StatusCodes.OK, data: resResult });
  });

  // book provider & init transaction
  book = catchAsync(async (req, res) => {
    const auth = req.user;

    if (!auth) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
    }

    const jobId = req.params.id;
    const { providerId, promoCode } = req.body;

    const session = await startSession();
    session.startTransaction();

    try {
      const towTruck = await TowTruckService.getValidProviderOrThrow(providerId);

      // Set provider on job
      const job = await Job.findOneAndUpdate(
        {
          _id: jobId,
          status: 'created',
          providerId: null,
          userId: auth.userId,
        },
        {
          providerId,
          status: 'requested' as IJobStatus,
        },
        {
          new: true,
          session,
        }
      );

      if (!job) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Trip not found or already booked');
      }

      // Calculate prices
      const { amount, charge, discount, finalAmount } =
        await TowTypeService.calculatePrices(
          towTruck.towTypeId,
          job.distance,
          promoCode,
          auth.userId
        );

      // Create transaction
      const tx = await Transaction.create(
        [
          {
            userId: auth.userId,
            providerId,
            jobId,
            amount,
            discount,
            charge,
            finalAmount,
            status: 'created',
          },
        ],
        { session }
      );

      if (!tx?.length) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Transaction creation failed');
      }

      await session.commitTransaction();
      session.endSession();

      sendResponse(res, {
        code: StatusCodes.CREATED,
        message: 'Trip booked successfully',
        data: tx[0], // or return job info if you prefer
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  });


  cancelTrip = catchAsync(async (req, res) => {
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
    || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Trip not found or already in progress'); })();

    // delete transaction
    await Transaction.deleteMany({ jobId: id });

    // make notification
    await NotificationService.addNotification({receiverId: job.providerId, title: 'Trip canceled', message: `${auth.name} have canceled the trip`});

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Trip canceled successfully' });
  });

  acceptTrip = catchAsync(async (req, res) => {
    const auth = req.user;

    if (!auth) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
    }

    const {id} = req.params;

    // set
    const job = await Job.findOneAndUpdate(
      { _id: id, status: 'requested', providerId: auth.userId }, // Fixed $in syntax
      { status: 'accepted' as IJobStatus },
      { new: true }
    )
    || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Trip not found or already in progress'); })();

    // make notification
    await NotificationService.addNotification({receiverId: job.userId, title: 'Trip accepted', message: `Provider have accepted the trip`});

    sendResponse(res, { code: StatusCodes.CREATED, message: 'Trip accepted successfully' });
  });


  review = catchAsync(async (req, res) => {
    const auth = req.user;

    if (!auth) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access.');
    }

    const {id} = req.params;
    const {rating, comment} = req.body;

    // set
    const job = await Job.findOneAndUpdate(
      { _id: id, status: 'completed' as IJobStatus, userId: auth.userId }, // Fixed $in syntax
      { rating, comment },
      { new: true }
    )
    || (() => { throw new ApiError(StatusCodes.NOT_FOUND, 'Trip not found or not complete yet'); })();

    // update the rating for tow truck
    TowTruckService.updateRating(job.providerId, rating);
    // make notification
    await NotificationService.addNotification({receiverId: job.providerId, title: 'Review', message: `${auth.name} give you ${rating}/5 rate`});
    sendResponse(res, { code: StatusCodes.CREATED, message: 'Review submitted successfully' });
  });
}


const JobController = new Controller();
export default JobController;
