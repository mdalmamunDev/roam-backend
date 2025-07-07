import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Mechanic from './mechanic.model';
import ApiError from '../../errors/ApiError';
import { Types } from 'mongoose';
import { UserService } from '../user/user.service';
import { validateFileAndGetName } from '../../helpers/validateHelper';

// Utility function for updating mechanic data
const updateMechanicStep = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid user ID');
  }

  const payload = req.body;
  // update the registration step
  const user = await UserService.updateUser(userId, { step: payload.step });
  const mechanic = await Mechanic.findOneAndUpdate({ userId }, payload, { new: true }).lean();

  if (!mechanic) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mechanic not found or update failed');
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Mechanic updated successfully', data: { ...mechanic, ...user } });
});

// Basic Info handler
const basicInfo = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.profileImage = validateFileAndGetName(req);
  }

  const { profileImage, name, platform, phone, address, haveLicense, haveCdl, step } = req.body;

  const userId = req.user?.userId;

  // Update user profile
  const user = await UserService.updateUser(userId, { name, profileImage, address, phone, step });
  // Upsert mechanic data
  const mechanic = await Mechanic.findOneAndUpdate(
    { userId },
    { platform, haveLicense, haveCdl },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  if (!mechanic) {
    return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: 'Something went wrong', });
  }

  sendResponse(res, { code: StatusCodes.CREATED, message: 'Mechanic basic info stored successfully', data: { ...user, ...mechanic } });
});

const updateMechanicResumeCertificate = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid user ID');
  }

  const user = await UserService.updateUser(userId, { step: req.body?.step });


  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (files?.resumeFile?.[0]) req.body.resume = files.resumeFile[0].filename;
  if (files?.certificateFile?.[0]) req.body.certificate = files.certificateFile[0].filename;

  const { resume, certificate } = req.body;

  const mechanic = await Mechanic.findOneAndUpdate({ userId }, { resume, certificate }, { new: true }).lean();

  if (!mechanic) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Mechanic not found or update failed');
  }

  sendResponse(res, { code: StatusCodes.OK, message: 'Mechanic updated successfully', data: { ...mechanic, ...user } });
});


export const MechanicController = {
  basicInfo,
  updateMechanicStep,
  updateMechanicResumeCertificate
};
