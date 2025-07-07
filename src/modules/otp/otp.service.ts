import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import ApiError from '../../errors/ApiError';
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from '../../helpers/emailService';
import OTP from './otp.model';
import { config } from '../../config';

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const createOTP = async (
  userEmail: string,
  expiresInMinutes: string,
  type: string
) => {
  const existingOTP = await OTP.findOne({
    userEmail,
    type,
    verified: false,
    expiresAt: { $gt: new Date() },
  });
  if (existingOTP) {

    // User can't create OTP within 1 minute of the last one
    const oneMinuteAgo = moment().subtract(config.otp.resentInMinutes, 'minute').toDate();
    if (existingOTP.createdAt && existingOTP.createdAt > oneMinuteAgo) {
      throw new ApiError( StatusCodes.TOO_MANY_REQUESTS, `Please wait ${config.otp.resentInMinutes*60}s before trying again.` );
    }

    const windowStart = moment()
      .subtract(config.otp.attemptWindowMinutes, 'minutes')
      .toDate();
    if (
      existingOTP.attempts >= config.otp.maxOtpAttempts &&
      existingOTP.lastAttemptAt &&
      existingOTP.lastAttemptAt > windowStart
    ) {
      // Calculate how much time is left before the user can try again
      const timeLeft = moment(existingOTP.lastAttemptAt)
        .add(config.otp.attemptWindowMinutes, 'minutes')
        .diff(moment(), 'seconds'); // Time left in seconds

      let remainingTime = null;
      // If timeLeft is positive, it means they need to wait this amount of seconds
      if (timeLeft > 0) {
        remainingTime = moment.duration(timeLeft, 'seconds').humanize(); // Convert seconds to human-readable format
      }

      throw new ApiError(
        StatusCodes.TOO_MANY_REQUESTS,
        `Too many attempts. Please try again after ${remainingTime}`
      );
    }
  }
  await OTP.deleteMany({ userEmail, type });
  const otp = generateOTP();
  const otpDoc = await OTP.create({
    userEmail,
    otp,
    type,
    expiresAt: moment.utc().add(parseInt(expiresInMinutes), 'minutes').toDate(),
  });
  return otpDoc;
};

const verifyOTP = async (userEmail: string, otp: string, type: string) => {
  const otpDoc = await OTP.findOne({
    userEmail,
    type,
    verified: false,
  });

  if (!otpDoc || otpDoc.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'OTP not found or expired');
  }
  otpDoc.attempts += 1;
  otpDoc.lastAttemptAt = new Date();
  if (otpDoc.attempts > config.otp.maxOtpAttempts) {
    await otpDoc.save();
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `Too many attempts. Please try again after ${config.otp.attemptWindowMinutes} minutes`
    );
  }
  if (otpDoc.otp !== otp) {
    await otpDoc.save();
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }
  otpDoc.verified = true;
  await otpDoc.save();
  return true;
};

const createVerificationEmailOtp = async (email: string) => {
  const otpDoc = await createOTP(
    email,
    config.otp.verifyEmailOtpExpiration.toString(),
    'verify'
  );
  await sendVerificationEmail(email, otpDoc.otp);
  return otpDoc;
};

const createResetPasswordOtp = async (email: string) => {
  const otpDoc = await createOTP(
    email,
    config.otp.resetPasswordOtpExpiration.toString(),
    'resetPassword'
  );
  await sendResetPasswordEmail(email, otpDoc.otp);
  return otpDoc;
};

export const OtpService = {
  createOTP,
  verifyOTP,
  createVerificationEmailOtp,
  createResetPasswordOtp,
};
