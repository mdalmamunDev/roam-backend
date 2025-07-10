import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import mongoose from 'mongoose';
import paginate from '../../helpers/paginationHelper';
import Promo from './promo.model';

class Controller {
    // Create a new promo
  create = catchAsync(async (req: Request, res: Response) => {
    const result = await Promo.create(req.body);
    if (!result) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create promo');
    sendResponse(res, { code: StatusCodes.CREATED, message: 'Promo created successfully', data: result });
  });

  // Get all promos (with pagination + filters)
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, code, type } = req.query;

    const filters: any = {};

    if (status) filters.status = status;
    if (code) filters.code = code;
    if (type) filters.type = type;

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Promo
    });

    sendResponse(res, { code: StatusCodes.OK, message: 'Promos fetched successfully', data: results, pagination });
  });

  // Get single promo by ID
  getSingle = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid promo ID');

    const promo = await Promo.findById(id).lean();
    if (!promo) throw new ApiError(StatusCodes.NOT_FOUND, 'Promo not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Promo fetched successfully', data: promo });
  });

  // Update promo
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid promo ID');

    const promo = await Promo.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!promo) throw new ApiError(StatusCodes.NOT_FOUND, 'Promo not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Promo updated successfully', data: promo });
  });

  // Delete promo
  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid promo ID');

    const promo = await Promo.findByIdAndDelete(id).lean();
    if (!promo) throw new ApiError(StatusCodes.NOT_FOUND, 'Promo not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Promo deleted successfully', data: promo });
  });
}

const PromoController = new Controller();
export default PromoController;
