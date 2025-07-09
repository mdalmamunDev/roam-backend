import { Router } from 'express';
import { AuthController } from './auth.controller';
import validateRequest from '../../shared/validateRequest';
import { createUserValidationSchema } from '../user/user.validation';
import { AuthValidation } from './auth.validations';
import auth from '../../middlewares/auth';
import { extractToken } from '../../middlewares/extractToken';

const router = Router();
router.post(
  '/register',
  validateRequest(createUserValidationSchema),
  AuthController.register
);

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.post(
  '/forgot-password',
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

router.post('/resend-otp', extractToken, AuthController.resendOtp);

router.post(
  '/reset-password',
  extractToken,
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthController.resetPassword
);

router.post(
  '/change-password',
  auth('common'),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// verify email and reset password
router.post(
  '/verify-email',
  extractToken,
  validateRequest(AuthValidation.verifyEmailValidationSchema),
  AuthController.verifyEmail
);

router.post('/logout', auth('common'), AuthController.logout);

router.post('/refresh-auth', AuthController.refreshToken);

export const AuthRoutes = router;
