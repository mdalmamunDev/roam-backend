import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';
import ApiError from '../../errors/ApiError';

// register
const register = catchAsync(async (req, res) => {

  // confirm password
  const { password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password and Confirm Password not matched.'
    );
  }

  req.body.filePath = req.file?.filename;

  const result = await AuthService.createUser(req.body);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    message: 'User created successfully, please verify your email',
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);

  if (result.verifyEmailToken) {
    return sendResponse(res, {
      code: StatusCodes.FORBIDDEN, // 403
      // @ts-ignore
      message: result.message,
      // @ts-ignore
      data: { verifyEmailToken: result.verifyEmailToken },
    });
  }

  // Ensure tokens exist before setting cookies
  if (result.tokens) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      ...result,
      tokens: result.tokens, // Handle null case
    },
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, token, otp } = req.body;
  const result: any = await AuthService.verifyEmail(email, token, otp);

  if (result?.refreshToken) {
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // set maxAge to a number
      sameSite: 'lax',
    });
  }

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Email verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const result = await AuthService.resendOtp(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Otp sent successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset email sent successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Password and Confirm Password not matched.'
    );
  }

  const result = await AuthService.resetPassword(email, password);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password reset successfully',
    data: {
      result,
    },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'New password and Confirm password are not matched!'
    );
  }

  const result = await AuthService.changePassword(
    userId,
    currentPassword,
    password
  );
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'Password changed successfully',
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  const user = req.user;
  await AuthService.logout(user.userId);

  res.clearCookie('refreshToken');

  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged out successfully',
    data: {},
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = await AuthService.refreshAuth(req.cookies.refreshToken);
  sendResponse(res, {
    code: StatusCodes.OK,
    message: 'User logged in successfully',
    data: {
      accessToken: token,
    },
  });
});

export const AuthController = {
  register,
  login,
  verifyEmail,
  resendOtp,
  logout,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
};
