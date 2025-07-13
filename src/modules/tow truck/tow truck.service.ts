import { Types } from 'mongoose';
import ITowTruck from './tow truck.interface';
import TowTruck from './tow truck.model';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import { TUserStatus } from '../user/user.constant';

const getValidProviderOrThrow = async (userId: Types.ObjectId | string): Promise<any> => {
  const [user, tt] = await Promise.all([
    User.findOne({ _id: userId, status: 'active' as TUserStatus }).lean(),
    TowTruck.findOne({ userId, isVerified: true }).lean()
  ]);
  if(!user || !tt) throw new ApiError(StatusCodes.NOT_FOUND, 'Provider inactive or not verified yet')
  return {...user, ...tt}
};

const getValidProvider = async (userId: Types.ObjectId | string): Promise<any> => {
  const [user, tt] = await Promise.all([
    User.findOne({ _id: userId, status: 'active' as TUserStatus }).lean(),
    TowTruck.findOne({ userId, isVerified: true }).lean()
  ]);
  return {...user, ...tt}
};

const updateRating = async (userId: Types.ObjectId | string | undefined, rating: number): Promise<any> => {
  // Update provider rating
  const towTruck = await TowTruck.findOne({userId});
  if (!towTruck) return;

  // Calculate new average rating
  const newTotalRating = (towTruck.totalRating || 0) + 1;
  const newAvgRating = ((towTruck.avgRating || 0) * (towTruck.totalRating || 0) + rating) / newTotalRating;

  towTruck.totalRating = newTotalRating;
  towTruck.avgRating = newAvgRating;
  await towTruck.save();
};


export const TowTruckService = {
  getValidProviderOrThrow,
  getValidProvider,
  updateRating,
};
