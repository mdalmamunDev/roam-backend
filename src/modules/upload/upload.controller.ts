import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

export const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'No file uploaded' });
    return;
  }

  const file = req.file;
  const normalizedPath = file.filename;

  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: {
      ...file,
      path: normalizedPath,
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`, // optional
    },
  });
});

export const uploadMultipleFiles = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'No files uploaded' });
    return;
  }

  const fileData = files.map(file => (
    file.filename
  ));

  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: fileData,
  });
});