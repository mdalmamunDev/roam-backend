import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import { config } from '../config';

// Middleware to extract the resend otp, verify email and reset password token
/** 
@description Middleware to extract the resend otp, verify email and reset password token
@param -> req, res, next
*/
export const extractToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization; // Get the Authorization header

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return; // Ensure the function stops here
    }

    const token = authHeader.split(' ')[1]; // Extract the token after "Bearer"
    const decoded = JWT.verify(token, config.token.TokenSecret); // this is only work for verify email and reset password token
    req.body.token = token; // decoded = {userId, email, role}
    // @ts-ignore
    req.body.email = decoded?.email;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is expired.', success: false });
    return;
  }
};
