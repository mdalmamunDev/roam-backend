import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import CarModel from './car models.model';
import { Types } from 'mongoose';
import paginate from '../../helpers/paginationHelper';

// get all Car models
const getAll = catchAsync(async (req, res) => {
  const result = await CarModel.find().select('name');
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Car models retrieved successfully',
    data: result,
  });
});

const getAllPaginated = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', keyword } = req.query;

  let filters: any = {};
  if (keyword) {
    const keywordFilter: any = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },  // Case-insensitive search for name
        { _id: Types.ObjectId.isValid(keyword as string) ? new Types.ObjectId(keyword as string) : null }, // Search by _id if valid
      ],
    };
    filters = { ...filters, ...keywordFilter };
  }
  // Call the paginate function with required parameters
  const { results, pagination } = await paginate({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortField: sortField as string,
    sortOrder: sortOrder as string,
    model: CarModel,
    populate: [{ path: 'adminId', select: 'name email' }]
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Car models retrieved successfully', data: results, pagination });
});

// create a new car model
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  const payload = req.body;
  payload.adminId = auth.userId;
  const model = new CarModel(payload);
  const result = await model.save();

  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'Car model created successfully',
    data: result,
  });
});

// Update an existing car model by ID
const update = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract car model ID from params
  const payload = req.body;

  // Find the car model by ID and update it
  const result = await CarModel.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Car model not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Car model updated successfully',
    data: result,
  });
});

// Delete a car model by ID
const drop = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract car model ID from params

  // Find and delete the car model by ID
  const result = await CarModel.findByIdAndDelete(id);

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Car model not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Car model deleted successfully',
    data: result,
  });
});

export const CarModelController = {
  getAll,
  getAllPaginated,
  create,
  update,
  drop,
};
