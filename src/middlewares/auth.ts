import e, { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import { roleRights } from './roles';
import { User } from '../modules/user/user.model';
import ApiError from '../errors/ApiError';
import catchAsync from '../shared/catchAsync';
import { config } from '../config';
import { TokenType } from '../modules/token/token.interface';
import { TokenService } from '../modules/token/token.service';
import { Role, UserRole } from '../modules/user/user.constant';
import { string } from 'zod';

// export const auth = (role: string) =>
//   catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const admins = await User.find({ role: 'admin' });
//     if (admins.length > 0) {
//       const randomAdmin = admins[0];
//       req.user = randomAdmin;
//     }
//     next();
//   });

const auth = (role: string | Role[]) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // base case
    if (!role) throw new ApiError(StatusCodes.FORBIDDEN, 'Role is not defined');


    // Step 1: Get Authorization Header
    const tokenWithBearer = req.headers.authorization;
    if (!tokenWithBearer) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    if (!tokenWithBearer.startsWith('Bearer')) {
      // If the token format is incorrect
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }

    const token = tokenWithBearer.split(' ')[1];
    // Step 2: Verify Token
    const verifyUser = await TokenService.verifyToken(
      token,
      config.jwt.accessSecret as Secret,
      TokenType.ACCESS
    );
    // Step 3: Attach user to the request object
    req.user = verifyUser;

    // Step 4: Check if the user exists and is active
    const user = await User.findById(verifyUser.userId);
    if (!user) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User not found.');
    } else if (!user.isEmailVerified) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Your account is not verified.'
      );
    }

    if(user.isDeleted) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is deleted.');
    }
    // if(user.status != "verified") {
    //   throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is not verified.');
    // }

    req.user.location = user.location; // attach location to req.user
    req.user.name = user.name;
    req.user.wallet = user.wallet;

    // Step 5: Role-based Authorization
    if (role === 'common') role = UserRole;
    else if (typeof role === 'string') role = [role as Role];

    if (!role.includes(user.role as Role)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "You don't have permission to access this API"
      );
    }

    // Step 6: update params.userId
    const { userId } = req.params;
    if (userId) {
      if (userId === 'me' || userId === user._id?.toString()) {
        req.params.userId = verifyUser.userId;
        req.body.status = undefined; // remove status from body if it exists
        req.body.role = undefined; // remove role from body if it exists
      } else if (verifyUser.role !== 'admin') {
        // if the user is not an admin and passing other userId
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this API"
        );
      }
    }

    next();
  });

export default auth;
