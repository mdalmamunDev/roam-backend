import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Service from './services.model';
import paginate from '../../helpers/paginationHelper';
import { Types } from 'mongoose';

// get all Services
const getAll = catchAsync(async (req, res) => {
  const result = await Service.find().select('name');
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Services retrieved successfully',
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
    model: Service,
    populate: [{ path: 'adminId', select: 'name email' }]
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Services retrieved successfully', data: results, pagination });
});

// create a new Service
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  const payload = req.body;
  payload.adminId = auth.userId;
  const model = new Service(payload);
  const result = await model.save();

  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'Service created successfully',
    data: result,
  });
});

// Update an existing Service by ID
const update = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract Service ID from params
  const payload = req.body;

  // Find the Service by ID and update it
  const result = await Service.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Service not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Service updated successfully',
    data: result,
  });
});

// Delete a Service by ID
const drop = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract Service ID from params

  // Find and delete the Service by ID
  const result = await Service.findByIdAndDelete(id);

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Service not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Service deleted successfully',
    data: result,
  });
});

export const ServiceController = {
  getAll,
  getAllPaginated,
  create,
  update,
  drop,
};
