import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import TowType from './tow type.model';
import ApiError from '../../errors/ApiError';
import mongoose from 'mongoose';
import paginate from '../../helpers/paginationHelper';

class Controller {
  // Create a new tow type
  create = catchAsync(async (req: Request, res: Response) => {
    const result = await TowType.create(req.body);
    if (!result) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong');
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow type created successfully', data: result });
  });

  // Get all tow types
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, keyword } = req.query;

    const filters: any = {};

    // Add status filter if present
    if (status) filters.status = status;

    // Handle keyword search for customerId or providerId (by ObjectId or name)
    if (keyword) {
      filters.name = { $regex: keyword, $options: 'i' };
    }

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: TowType
    });

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow types retrieved successfully', data: results, pagination: pagination });
  });
  // Get all for provider
  getAllProvider = catchAsync(async (req: Request, res: Response) => {
    const result = await TowType.find().sort({ name: 1 }).select('name').lean();
    sendResponse(res, { code: StatusCodes.OK, message: 'Tow types retrieved successfully', data: result });
  });

  // Update a tow type
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');

    const result = await TowType.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Tow type not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow type updated successfully', data: result });
  });

  // Delete a tow type
  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID');

    const result = await TowType.findByIdAndDelete(id).lean();
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Tow type not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Tow type deleted successfully', data: result });
  });
}

const TowTypeController = new Controller();
export default TowTypeController;
