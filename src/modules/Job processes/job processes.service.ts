import { ObjectId, Types } from 'mongoose';
import JobProcess from './job processes.model';
import IJobProcess, { IJobProcessStatus, JobProcessStatusCustomer, JobProcessStatusDone, JobProcessStatusProvider, JobProcessStatusRunning } from './job processes.interface';
import Transaction from '../payment/transaction/transaction.model';
import { ITransactionType } from '../payment/transaction/transaction.interface';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { PaymentService } from '../payment/payment.service';
import { getAddressFromCoordinates, getDistanceInMiles } from '../../helpers/globalHelper';
import { Role } from '../user/user.constant';
import { MechanicService } from '../mechanic/mechanic.service';
import { Request } from 'express';

// Service to get a job process
const getAllByFilter = async (
  filter: Partial<IJobProcess>,
  populate: string[] = ['providerId', 'jobId', 'customerId'],
): Promise<IJobProcess[]> => {
  const query = JobProcess.find(filter).populate(populate);
  return query.exec();
};

// get by id
const getOneByFilter = async (filter: any) => {
  const result = await JobProcess.findOne(filter).populate([
    { path: 'providerId', select: 'name address profileImage' },
    { path: 'jobId', select: 'location destination' },
    { path: 'customerId', select: 'name address profileImage' },
    {
      path: 'services.serviceId'  // Populate serviceId inside services array
    }
  ]);

  if (result) {
    // Deep copy to avoid modifying Mongoose doc directly (optional)
    const obj: any = result.toObject();

    // Map over services to transform serviceId object into just service name
    obj.services = obj.services.map((service: any) => ({
      ...service,
      service: service.serviceId?.name || null,
      serviceId: undefined,
    }));

    if(obj.jobId) {
      obj.location = await getAddressFromCoordinates(obj.jobId.location?.coordinates)
      if(obj.jobId.destination) {
        obj.destination = await getAddressFromCoordinates(obj.jobId.destination?.coordinates)
        obj.totalDistance = getDistanceInMiles(obj.jobId.location?.coordinates, obj.jobId.destination?.coordinates)?.toFixed(2)
      }
    }

    // Or explicitly delete property:
    // obj.services.forEach(s => delete s.serviceId);
    obj.jobId = undefined;

    return obj;
  }

  return null;
};

// Service to update a job process by ID
const updateJobProcess = async (filter: any, updateData: Partial<IJobProcess>): Promise<IJobProcess | null> => {
  const { status } = updateData;

  const jobProcess = await JobProcess.findOne(filter);
  if (!jobProcess) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job process not found');
  }

  // no need to check is paid already cz, user can't his multiple with same status, bcz of prevStatus functionality :)
  if (status === 'accepted') {
    // Assume jobProcess.transportPrice exists
    const amount = 10; // TODO: Make this dynamic
    await PaymentService.transferBalance({
      customerId: jobProcess.customerId,
      providerId: jobProcess.providerId,
      jobProcessId: jobProcess._id,
      amount,
      type: 'transport',
      status: 'success', // non refundable
    });
  }
  if (status === 'paid' && jobProcess.servicePrice > 0) {
    // Example: get total price from jobProcess.services and make transaction
    await PaymentService.transferBalance({
      customerId: jobProcess.customerId,
      providerId: jobProcess.providerId,
      jobProcessId: jobProcess._id,
      amount: jobProcess.servicePrice,
      type: 'service',
    });
  }
  if (status === 'completed') {
    // transfer balance to provider
    await Transaction.updateMany(
      {
        jobProcessId: jobProcess._id,
        status: { $ne: 'success' }
      },
      { $set: { status: 'success' } }
    );
  }


  const updatedJobProcess = await JobProcess.findOneAndUpdate(
    filter,
    updateData,
    { new: true }
  );

  return updatedJobProcess;
};

// Service to get users' IDs for sharing location
const getUsersIdForShareLocation = async (userId: ObjectId | string): Promise<Types.ObjectId[]> => {
  if (!userId) return []; // Return an empty array if userId is invalid

  const jobProcesses = await JobProcess.find({
    $or: [
      { customerId: userId, status: { $in: JobProcessStatusRunning } },
      { providerId: userId, status: { $in: JobProcessStatusRunning } },
    ],
  }).select('customerId providerId').populate('customerId providerId');

  // Get all users who are involved in running job processes with the given user
  const usersIds = jobProcesses.map((job) => {
    const oppositeUser = job.customerId._id.toString() === userId ? job.providerId : job.customerId;
    return oppositeUser ? oppositeUser._id : null; // Return the ID or null if no opposite user found
  }).filter((id): id is Types.ObjectId => id !== null); // Filter out null values

  // Return unique IDs
  return Array.from(new Set(usersIds));
};

const autoUpdateStatuses = async ({ filters, oldStatus, newStatus, delay }: { filters: any; oldStatus: IJobProcessStatus, newStatus: IJobProcessStatus; delay: number; }): Promise<void> => {
  const jobsToUpdate = await JobProcess.find({
    ...filters,
    status: oldStatus,
    updatedAt: { $lt: new Date(Date.now() - delay * 60 * 1000) }, // converting delay to ms
  });

  for (const job of jobsToUpdate) {
    job.status = newStatus;
    await job.save();
  }
};


const getRoleStatus = (role: string) => {
  return role === 'customer' ? JobProcessStatusCustomer
    : role === 'provider' ? JobProcessStatusProvider
      : [];
};

const getProviderAdditional = async (req: Request, provider: any) => {
  if (!req || !provider) return null;

  let additionalData: any = {};  
  const jpResults = await JobProcess.aggregate([
    {
      $match: {
        providerId: provider._id,
        status: { $in: JobProcessStatusDone }
      }
    },
    {
      $group: {
        _id: null, // Grouping everything together (you could use providerId if you want a per-provider breakdown)
        avgRating: { $avg: { $ifNull: ["$rating", 0] } },  // Calculating the average, treating null as 0
        feedbackCount: { $sum: { $cond: [{ $ifNull: ["$comment", false] }, 1, 0] } } // Counting feedbacks where comment exists
      }
    }
  ]);

  additionalData.feedbackCount = jpResults.length > 0 ? jpResults[0].feedbackCount : 0;
  additionalData.avgRating = jpResults.length > 0 ? jpResults[0].avgRating : 0;

  if (provider.role === 'mechanic' as Role) {
    const mechanic = await MechanicService.getMechanic(provider._id);
    additionalData.certifications = mechanic?.certifications;
  } else if (provider.role === 'tow_truck' as Role) {
    additionalData.distance = getDistanceInMiles(req.user?.location?.coordinates, provider?.location?.coordinates)
  }

  return additionalData;
}

export const JobProcessService = {
  getAllByFilter,
  getOneByFilter,
  updateJobProcess,
  getUsersIdForShareLocation,
  autoUpdateStatuses,
  getRoleStatus,
  getProviderAdditional,
};
