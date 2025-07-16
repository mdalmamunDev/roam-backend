import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import mongoose, { Types } from 'mongoose';
import paginate from '../../helpers/paginationHelper';
import Report from './report.model';
import IReport from './report.interface';

class Controller {
    // Create a new report
  create = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if(!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access');

    const {providerId, jobId, reason } : IReport = req.body;
    const result = await Report.create({userId, providerId, jobId, reason});
    if (!result) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create report');
    sendResponse(res, { code: StatusCodes.CREATED, message: 'Report created successfully', data: result });
  });

  // Get all reports (with pagination + filters)
  getAll = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, keyword } = req.query;

    let filters: any = {};

    if (status) filters.status = status;
    if (keyword) {
      const keywordFilter: any = {
        $or: [
          { userId: Types.ObjectId.isValid(keyword as string) ? new Types.ObjectId(keyword as string) : null },
          { providerId: Types.ObjectId.isValid(keyword as string) ? new Types.ObjectId(keyword as string) : null },
        ],
      };
      filters = { ...filters, ...keywordFilter };
    }

    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Report
    });

    sendResponse(res, { code: StatusCodes.OK, message: 'Reports fetched successfully', data: results, pagination });
  });

  // Get single report by ID
  getSingle = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid report ID');

    const report = await Report.findById(id).lean();
    if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Report fetched successfully', data: report });
  });

  // Update report
  update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid report ID');

    const report = await Report.findByIdAndUpdate(id, req.body, { new: true }).lean();
    if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Report updated successfully', data: report });
  });

  // Delete report
  delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid report ID');

    const report = await Report.findByIdAndDelete(id).lean();
    if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');

    sendResponse(res, { code: StatusCodes.OK, message: 'Report deleted successfully', data: report });
  });
}

const ReportController = new Controller();
export default ReportController;
