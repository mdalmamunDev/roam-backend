import moment from 'moment';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { OtpService } from '../otp/otp.service';
import { User } from '../user/user.model';
import bcrypt from 'bcrypt';
import { TUser } from '../user/user.interface';
import { config } from '../../config';
import { TokenService } from '../token/token.service';
import { TokenType } from '../token/token.interface';
import { OtpType } from '../otp/otp.interface';
import { Secret } from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { formatDistanceToNow } from 'date-fns';

const validateUserStatus = (user: TUser) => {
  if (user.status === 'inactive') 
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Your account has been inactivated. Please contact support');

  if (user.isDeleted) 
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Your account has been deleted. Please contact support');
  
};

const createUser = async (userData: any) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  }

  const user = await User.create(userData);
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User creation failed');
  }

  //create verification email token
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  //create verification email otp
  await OtpService.createVerificationEmailOtp(user.email);
  return { verificationToken };
};

const login = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  validateUserStatus(user);

  // Check if the user's email is verified
  if (!user.isEmailVerified) {
    // Generate verification email token and OTP
    const verificationToken = await TokenService.createVerifyEmailToken(user);
    await OtpService.createVerificationEmailOtp(user.email);

    // Return verification token instead of throwing an error
    return {
      user: null,
      tokens: null,
      verifyEmailToken: verificationToken,
      message: 'Email not verified. Please verify your email.',
    };
  }

  // Check if the account is locked and whether the lock duration has expired
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingTime = formatDistanceToNow(user.lockUntil, {
      includeSeconds: true,
    });
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `Account is locked. Try again after ${remainingTime}`
    );
  } else {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Only lock the account if the failed login attempts exceed the maximum allowed
    if (user.failedLoginAttempts >= config.auth.maxLoginAttempts) {
      const lockUntil = moment().add(config.auth.lockTime, 'minutes').toDate();
      user.lockUntil = lockUntil;
      await user.save();
      throw new ApiError(
        423,
        `Account locked for ${config.auth.lockTime} minutes due to too many failed attempts`
      );
    }

    await user.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const userObj = JSON.parse(JSON.stringify(user)) as TUser;
  const tokens = await TokenService.accessAndRefreshToken(userObj);

  const userProfile = await UserService.getSingleUser(userObj._id.toString());

  return {
    user: userProfile,
    tokens,
  };
};

const verifyEmail = async (email: string, token: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await TokenService.verifyToken(
    token,
    config.token.TokenSecret,
    user?.isResetPassword ? TokenType.RESET_PASSWORD : TokenType.VERIFY
  );

  //verify otp
  await OtpService.verifyOTP(
    user.email,
    otp,
    user?.isResetPassword ? OtpType.RESET_PASSWORD : OtpType.VERIFY
  );

  const userObj = JSON.parse(JSON.stringify(user)) as TUser;
  const retData = user.isResetPassword
    ? { token: await TokenService.createResetPasswordToken(user) }
    : await TokenService.accessAndRefreshToken(userObj);

  user.isEmailVerified = true;
  await user.save();

  return retData;
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  //create reset password token
  const resetPasswordToken = await TokenService.createResetPasswordToken(user);
  await OtpService.createResetPasswordOtp(user.email);
  user.isResetPassword = true;
  await user.save();
  return { resetPasswordToken };
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user?.isResetPassword) {
    await OtpService.createResetPasswordOtp(user.email);
    const resetPasswordToken = await TokenService.createResetPasswordToken(
      user
    );
    return { resetPasswordToken };
  }
  await OtpService.createVerificationEmailOtp(user.email);
  const verificationToken = await TokenService.createVerifyEmailToken(user);
  return { verificationToken };
};

const resetPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  user.password = newPassword;
  user.isResetPassword = false;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select('+password').select('-wallet');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  const { password, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

const logout = async (userId: string) => {
  await TokenService.deleteUserTokens(userId);
};

const refreshAuth = async (refreshToken: string) => {
  const data = await TokenService.verifyToken(
    refreshToken,
    config.jwt.refreshSecret as Secret,
    TokenType.REFRESH
  );

  if (!data) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const user = await User.findById(data.userId).lean();

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  validateUserStatus(user);

  const userInfo = JSON.parse(JSON.stringify(user)) as TUser;
  const tokens = await TokenService.accessAndRefreshToken(userInfo);

  return tokens.accessToken;
};

export const AuthService = {
  createUser,
  login,
  verifyEmail,
  resetPassword,
  forgotPassword,
  resendOtp,
  logout,
  changePassword,
  refreshAuth,
};
