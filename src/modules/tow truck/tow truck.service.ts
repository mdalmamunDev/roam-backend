import { Types } from 'mongoose';
import ITowTruck from './tow truck.interface';
import TowTruck from './tow truck.model';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

// const getTowTruck = async (
//   userId: Types.ObjectId | string
// ): Promise<ITowTruck | null> => {
//   // Logic to get a tow truck by userId
//   const towTruck = await TowTruck.findOne({ userId }).lean();
//   return towTruck;
// };


export const TowTruckService = {
  // getTowTruck,
};
