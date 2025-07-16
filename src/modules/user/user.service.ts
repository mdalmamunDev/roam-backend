import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { TUser } from './user.interface';
import { User } from './user.model';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';
import { Role, TUserStatus } from './user.constant';
import { ObjectId, Types } from 'mongoose';
import colors from 'colors';
import { logger } from '../../shared/logger';
import moment from 'moment';

interface IAdminOrSuperAdminPayload {
  email: string;
  password: string;
  role: string;
  message?: string;
}

const createAdminOrSuperAdmin = async (
  payload: IAdminOrSuperAdminPayload
): Promise<TUser> => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This email already exists');
  }
  const result = new User({
    first_name: 'New',
    last_name: ` ${payload.role === 'admin' ? 'Admin' : 'Super Admin'}`,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  });

  await result.save();
  //send email for the new admin or super admin via email service
  // todo
  sendAdminOrSuperAdminCreationEmail(
    payload.email,
    payload.role,
    payload.password,
    payload.message
  );

  return result;
};
const getAllUsers = async (
  filters: Record<string, any>,
  options: PaginateOptions
): Promise<PaginateResult<TUser>> => {
  const query: Record<string, any> = {};
  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }
  return await User.paginate(query, options);
};

const getRecentUsers = async (limit: number) => {
  const users = await User.find({ isDeleted: false, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name email address createdAt');

  const updatedUsers = users.map((user: any) => ({
    ...user.toObject(),
    ago: moment(user.createdAt).fromNow(),
  }));
  return updatedUsers;
};

const getFilteredUsersWithConnectionStatus = async (
  userId: string,
  filters: Record<string, any>,
  options: PaginateOptions
) => {
  const query: Record<string, any> = {
    role: { $in: ['mentor', 'mentee'] },
  };

  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }

  options.populate = [
    {
      path: 'connections',
      match: { senderId: userId },
    },
  ];
  // Fetch users with pagination
  const usersResult = await User.paginate(query, options);

  return usersResult;
};

const getSingleUser = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId).select('-wallet').lean();
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  if (result.isDeleted) throw new ApiError(StatusCodes.NOT_FOUND, 'User deleted');

  return result;
};

const updateUserStatus = async (
  userId: string,
  payload: Partial<TUser>
): Promise<TUser | null> => {
  const result = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-wallet');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return result;
};
const updateUserProfile = async (
  userId: string,
  payload: any
): Promise<any> => {
  const result = await User.findByIdAndUpdate(userId, payload, {
    new: true,
  }).select('-wallet').lean();

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return result;
};
const updateUser = async (userId: string, payload: Partial<TUser>): Promise<TUser | null> => {
  const existingUser = await User.findById(userId).lean();
  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (!payload.step || (payload.step <= (existingUser.step || 0))) {
    payload.step = undefined;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-wallet').lean();
  if (!updatedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  return updatedUser;
};

const deleteUserProfile = async (userId: string): Promise<TUser | null> => {
  const result = await User.findById(userId).select('-wallet');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  result.isDeleted = true;
  await result.save();
  return result;
};


// Get user in radius
const getUsersInRadius = async (coordinates: number[], distanceInMiles: number, role: string, excludeId: ObjectId) => {
  const earthRadiusInMiles = 3963.2;

  const users = await User.find({
    location: {
      $geoWithin: {
        $centerSphere: [coordinates, distanceInMiles / earthRadiusInMiles],
      },
    },
    _id: { $ne: excludeId }, // Exclude the user with the specified _id
    role: role, // Match the specified role
    status: 'active', // Match the specified status
  }).select('location name profileImage');

  /// loop for each user and set cordinates
  const result2 = [];
  for (const user of users) {
    const obj: any = { ...user.toObject() };
    obj.location = undefined;
    if (user.location && user.location.coordinates) {
      const [lng, lat] = user.location.coordinates;
      obj.coordinates = [lng, lat];
      obj._id = user._id;
    }
    result2.push(obj);
  }

  return result2;
};

const updateUserLocation = async (data: { userId: string, lng: number; lat: number }) => {
  const { userId, lng, lat } = data;
  if (!userId || !lng || !lat) {
    logger.error(colors.red('Invalid userId, lng, or lat for location-share event'));
    return;
  }

  // update the user location in the database
  try {
    const result = await User.findByIdAndUpdate(userId, {
      location: {
        type: 'Point', // GeoJSON type
        coordinates: [lng, lat], // [longitude, latitude]
      },
      isOnline: true
    }, {
      new: true,
    })

    if (!result) {
      logger.error(colors.red('Failed to save live location to database'));
      return;
    }
  } catch (error) {
    logger.error(colors.red(`Error updating live location in the database: ${error}`));
    return;
  }

  // get the user IDs to share the location with
  let userIds: any[] = [];
  try {
    // userIds = await JobProcessService.getUsersIdForShareLocation(userId);
  } catch (error) {
    logger.error(colors.red(`Error retrieving user IDs for location sharing: ${error}`));
    return;
  }

  // loop for each userId and emit the location
  for (const uid of userIds) {
    // @ts-ignore
    io.to(uid.toString()).emit('location-receive', data);
  }
  logger.info(colors.green(`Live location sent from ${userId} to ${userIds.length} users [${lng}, ${lat}]`));
};


const getTotalUsers = async (role: Role) => {
  const total = await User.countDocuments({ isDeleted: false, status: 'active' as TUserStatus, role })
  return total;
}

const updateRating = async (userId: Types.ObjectId | string | undefined, rating: number): Promise<any> => {
  // Update provider rating
  const user = await User.findById(userId);
  if (!user) return;

  // Calculate new average rating
  const newTotalRating = (user.totalRating || 0) + 1;
  const newAvgRating = ((user.avgRating || 0) * (user.totalRating || 0) + rating) / newTotalRating;

  user.totalRating = newTotalRating;
  user.avgRating = newAvgRating;
  await user.save();
};

export const UserService = {
  createAdminOrSuperAdmin,
  getAllUsers,
  getRecentUsers,
  getSingleUser,
  updateUserStatus,
  updateUserProfile,
  updateUser,
  getFilteredUsersWithConnectionStatus,
  deleteUserProfile,
  getUsersInRadius,
  updateUserLocation,
  getTotalUsers,
  updateRating,
};
