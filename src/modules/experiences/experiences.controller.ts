import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Experience from './experiences.model';
import { Types } from 'mongoose';
import paginate from '../../helpers/paginationHelper';

// get all experiences
const getAll = catchAsync(async (req, res) => {
  const result = await Experience.find().select('name');
  sendResponse(res, { code: StatusCodes.OK, message: 'Experiences retrieved successfully', data: result });
});
// get all experiences
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
    model: Experience,
    populate: [{ path: 'adminId', select: 'name email' }]
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Experiences retrieved successfully', data: results, pagination });
});

// create a new experience
const create = catchAsync(async (req, res) => {
  const auth = req.user;

  const payload = req.body;
  payload.adminId = auth.userId;
  const model = new Experience(payload);
  const result = await model.save();

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Experience created successfully', data: result });
});

// update an existing experience by ID
const update = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract experience ID from params
  const payload = req.body;

  // Find the experience by ID and update it
  const result = await Experience.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Experience not found' });
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Experience updated successfully', data: result });
});

// delete an experience by ID
const drop = catchAsync(async (req, res) => {
  const { id } = req.params; // Extract experience ID from params

  // Find and delete the experience by ID
  const result = await Experience.findByIdAndDelete(id);

  if (!result) {
    return sendResponse(res, { code: StatusCodes.NOT_FOUND, message: 'Experience not found' });
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Experience deleted successfully', data: result });
});

export const ExperienceController = {
  getAll,
  getAllPaginated,
  create,
  update,
  drop,
};
