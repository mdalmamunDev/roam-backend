import { Types } from 'mongoose';
import ITowTruck from './tow truck.interface';
import TowTruck from './tow truck.model';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const getTowTruck = async (
  userId: Types.ObjectId | string
): Promise<ITowTruck | null> => {
  // Logic to get a tow truck by userId
  const towTruck = await TowTruck.findOne({ userId }).lean();
  return towTruck;
};

const createTowTruck = async (data: any): Promise<ITowTruck> => {
  try {
    const ttModel = new TowTruck(data);
    const savedTT = await ttModel.save();

    if (!savedTT) {
      throw new Error('Failed to create TowTruck');
    }

    return savedTT;
  } catch (error) {
    console.error('Error creating TowTruck:', error);
    throw new Error('Failed to create TowTruck');
  }
};

const updateTowTruck = async (userId: string | Types.ObjectId, updateData: Partial<ITowTruck>): Promise<any> => {

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Yor are not authorized.');
  }

  // Find the towTruck by userId and update the fields
  const towTruck = await TowTruck.findOneAndUpdate(
    { userId }, // Find towTruck by userId
    { $set: updateData }, // Update fields
    { new: true } // Return the updated document
  ).lean();

  if (!towTruck) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Tow truck not found.');
  }
  return towTruck;
};

export const TowTruckService = {
  getTowTruck,
  createTowTruck,
  updateTowTruck,
};
