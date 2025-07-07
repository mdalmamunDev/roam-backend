import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { FcmToken } from './fcm token.model';
import { ObjectId, Schema } from 'mongoose';


const store = async (fcmToken: string, userId: string | ObjectId) => {
  if (!userId || !fcmToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "userId and token are required.");
  }

  const fcm = await FcmToken.findOneAndUpdate(
    { userId },     // search by userId
    { $set: { fcmToken, userId } },              // update payload
    { new: true, upsert: true }     // create if not found
  );

  return fcm;
};

const getToken = async (userId: string | ObjectId) => {
  if (!userId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "userId is required.");
  }

  const fcm = await FcmToken.findOne({ userId });
  if (!fcm) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No fcm token found.");
  }

  return fcm?.fcmToken.toString();
};



export const FcmTokenService = {
  store,
  getToken,
};
