import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { TUser } from '../user/user.interface';
import { config } from '../../config';
import { addMinutes, addDays } from 'date-fns';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { TokenType } from './token.interface';
import { Token } from './token.model';

const getExpirationTime = (expiration: string) => {
  const timeValue = parseInt(expiration);
  if (expiration.includes('d')) {
    return addDays(new Date(), timeValue);
  } else if (expiration.includes('m')) {
    return addMinutes(new Date(), timeValue);
  }
  return new Date();
};

const createToken = (payload: object, secret: Secret, expireTime: string) => {
  // @ts-ignore
  return jwt.sign(payload, secret, { expiresIn: expireTime });
};

const verifyToken = async (
  token: string,
  secret: Secret,
  tokenType: TokenType
) => {
  const decoded = jwt.verify(token, secret) as JwtPayload;
  const storedToken = await Token.findOne({
    token,
    user: decoded.userId,
    type: tokenType,
  });

  if (!storedToken) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Token is invalid or already used'
    );
  }
  if (storedToken.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Token has expired');
  }
  if (storedToken.type !== tokenType) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid token type');
  }
  storedToken.verified = true;
  await storedToken.save();
  return decoded;
};

const createVerifyEmailToken = async (user: TUser) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    type: 'verify_email',
  };
  await Token.deleteMany({ user: user._id });
  const verifyEmailToken = createToken(
    payload,
    config.token.TokenSecret,
    config.token.verifyEmailTokenExpiration
  );
  const expiresAt = getExpirationTime(config.token.verifyEmailTokenExpiration);

  await Token.create({
    token: verifyEmailToken,
    user: user._id,
    type: TokenType.VERIFY,
    expiresAt,
  });
  return verifyEmailToken;
};

const createResetPasswordToken = async (user: TUser) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    type: 'reset_password',
  };
  await Token.deleteMany({ user: user._id });
  const resetPasswordToken = createToken(
    payload,
    config.token.TokenSecret,
    config.token.resetPasswordTokenExpiration
  );
  const expiresAt = getExpirationTime(
    config.token.resetPasswordTokenExpiration
  );

  await Token.create({
    token: resetPasswordToken,
    user: user._id,
    type: TokenType.RESET_PASSWORD,
    expiresAt,
  });
  return resetPasswordToken;
};

const accessAndRefreshToken = async (user: TUser) => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  await Token.deleteMany({ user: user._id });
  const accessToken = createToken(
    payload,
    config.jwt.accessSecret,
    config.jwt.accessExpiration
  );
  const refreshToken = createToken(
    payload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiration
  );
  await Token.create({
    token: accessToken,
    user: user._id,
    type: TokenType.ACCESS,
    expiresAt: getExpirationTime(config.jwt.accessExpiration),
  });
  await Token.create({
    token: refreshToken,
    user: user._id,
    type: TokenType.REFRESH,
    expiresAt: getExpirationTime(config.jwt.refreshExpiration),
  });

  return { accessToken, refreshToken };
};

const deleteUserTokens = (userId: string) => {
  return Token.deleteMany({ user: userId });
};

const decodeResnedOTPToken = (token: string) => {
  return jwt.verify(token, config.token.TokenSecret) as jwt.JwtPayload;
};

export const TokenService = {
  createToken,
  verifyToken,
  createVerifyEmailToken,
  createResetPasswordToken,
  accessAndRefreshToken,
  deleteUserTokens,
  decodeResnedOTPToken,
};
