import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import { UserService } from './user.service';
import { User } from './user.model';
import paginate from '../../helpers/paginationHelper';
import { Role, UserRole } from './user.constant';
import { Types } from 'mongoose';
import TowTruck from '../tow truck/tow truck.model';

const createAdminOrSuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await UserService.createAdminOrSuperAdmin(payload);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: result,
    message: `${payload.role === 'admin' ? 'Admin' : 'Super Admin'
      } created successfully`,
  });
});

// Function to generate a random location within `radius` km from Dhaka
const generateRandomLocation = (radius: number) => {
  const dhakaCoordinates = { lat: 23.8103, lng: 90.4125 };
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomDistance = Math.random() * radius; // Distance in km

  // Radius of Earth in kilometers
  const earthRadius = 6371;

  const deltaLat = (randomDistance / earthRadius) * (180 / Math.PI);
  const deltaLng = (randomDistance / earthRadius) * (180 / Math.PI) / Math.cos(dhakaCoordinates.lat * (Math.PI / 180));

  // New coordinates
  const newLng = dhakaCoordinates.lng + deltaLng * Math.cos(randomAngle);
  const newLat = dhakaCoordinates.lat + deltaLat * Math.sin(randomAngle);

  return { lng: newLng, lat: newLat };
};

const updateAllUsersLocation = catchAsync(async (req, res) => {
  const users = await User.find();

  if (users.length === 0) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'No users found',
    });
  }

  // Loop through each user and update the location
  for (const user of users) {
    // Generate random location within 10 km radius of Dhaka
    const { lng, lat } = generateRandomLocation(10);

    // Update user location
    await User.findByIdAndUpdate(user._id, {
      $set: {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
    });

  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: await User.find(),
    message: 'My location updated successfully',
  });
});












// Get all users with pagination and filters
const getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortField = 'createdAt',
    sortOrder = 'desc',
    role,
    keyword,
  } = req.query;

  if (role && !UserRole.includes(role as Role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Role not valid.');
  }

  // Extract filters from query params
  let filters: any = {};
  filters.isDeleted = false; // Ensure we only get non-deleted users

  if (role) {
    filters.role = role;
  }

  // Handle the keyword filter (user.name or user._id)
  if (keyword) {
    const keywordFilter: any = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },  // Case-insensitive search for name
        { email: keyword },
        { phone: keyword },
        { _id: Types.ObjectId.isValid(keyword as string) ? new Types.ObjectId(keyword as string) : null }, // Search by _id if valid
      ],
    };
    filters = { ...filters, ...keywordFilter };
  }

  // keyword can user.name or user._id write the filter logic for keyword

  // Call the paginate function with required parameters
  let { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: User,
    select: 'name email address phone dateOfBirth role profileImage createdAt status'
  });

  // join to TowTruck where towTruck.userId == User._id and get isVerified
  if (role === 'provider') {
    results = await Promise.all(results.map(async (user: any) => {
      const towTruck = await TowTruck.findOne({ userId: user._id }, 'isVerified');
      return {
        ...user.toObject(),
        isVerified: towTruck?.isVerified ?? false
      };
    }));
  }

  // Send the response with the results and pagination info
  return sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Users retrieved successfully',
    data: results,
    pagination,
  });
});


//get single user from database
const getSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserService.getSingleUser(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//update user status from database
const updateUserStatusOrRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { status, role } = req.body;
  const result = await UserService.updateUserStatus(userId, { status, role });
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User status or role updated successfully',
  });
});

//update user
const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;
  payload.status = undefined; // remove status from body if it exists
  payload.role = undefined; // remove role from body if it exists
  payload.location = undefined; // remove location from body if it exists
  const result = await UserService.updateUserProfile(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

//update user
const updateMyLocation = catchAsync(async (req, res) => {
  const { lng, lat } = req.body;

  if (!lng || !lat) {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Latitude and Longitude are required',
    });
  }

  const result = await UserService.updateUserProfile(req.user.userId, {
    location: {
      type: 'Point', // GeoJSON type
      coordinates: [lng, lat], // [longitude, latitude]
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result.location?.coordinates,
    message: 'My location updated successfully',
  });
});

const getUsersInRadius = catchAsync(async (req, res) => {
  // const { lng, lat, distanceInMiles } = req.body;
  const { radius, role } = req.params;
  if (!radius) {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Radius is required',
    });
  }


  if (!req.user?.location?.coordinates) {
    return sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      message: 'Please turn on your location',
    });
  }

  const { coordinates } = req.user.location;

  const users = await UserService.getUsersInRadius(coordinates, Number(radius), role, req.user.userId);

  if (!users || users.length === 0) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'No users found in this radius',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: users,
    message: 'Users in radius fetched successfully',
  });
});

const getUserLocation = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getSingleUser(id);

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result.location,
    message: 'User location fetched successfully'
  });
});

//delete user from database
const deleteUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.deleteUserProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User deleted successfully',
  });
});

export const UserController = {
  // createAdminOrSuperAdmin,
  // updateAllUsersLocation,


  getAllUsers,
  getSingleUser,
  updateUserStatusOrRole,
  updateMyLocation,
  getUserLocation,
  getUsersInRadius,
  updateUserProfile,
  deleteUserProfile,
};
