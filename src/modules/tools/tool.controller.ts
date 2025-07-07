import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { Role } from '../user/user.constant';
import Tool from './tool.model';
import { Types } from 'mongoose';
import paginate from '../../helpers/paginationHelper';

// get all Tools
const getAll = catchAsync(async (req, res) => {
  const result = await Tool.aggregate([
    {
      $group: {
        _id: '$group',
        tools: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        tools: {
          _id: 1,
          name: 1
        }
      }
    }
  ]);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Tools grouped by group retrieved successfully',
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
    model: Tool,
    populate: [{ path: 'adminId', select: 'name email' }]
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Tools retrieved successfully', data: results, pagination });
});

// create a new experience
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  const payload = req.body;
  payload.adminId = auth.userId;
  const model = new Tool(payload);
  const result = await model.save();

  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'Tool created successfully',
    data: result,
  });
});

// update an existing tool by ID
const update = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract tool ID from params
  const payload = req.body;

  // Find the tool by ID and update it
  const result = await Tool.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Tool not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Tool updated successfully',
    data: result,
  });
});

// delete a tool by ID
const drop = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract tool ID from params

  // Find and delete the tool by ID
  const result = await Tool.findByIdAndDelete(id);

  if (!result) {
    return sendResponse(res, {
      code: StatusCodes.NOT_FOUND,
      message: 'Tool not found',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Tool deleted successfully',
    data: result,
  });
});

export const ToolController = {
  getAll,
  getAllPaginated,
  create,
  update,
  drop,
};
