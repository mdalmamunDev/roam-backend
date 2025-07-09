import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { updateUserStatusOrRoleSchema, updateUserValidationSchema, UserValidation } from './user.validation';

const router = express.Router();

//main routes
router.get('/', auth('admin'), UserController.getAllUsers);

// get users in radius
router.get('/radius/:role/:radius', auth('customer'), UserController.getUsersInRadius);

router
  .route('/:userId')
  .get(auth('common'), UserController.getSingleUser)
  .put(
    auth('common'),
    validateRequest(updateUserValidationSchema),
    UserController.updateUserProfile
  )
  .patch(auth('admin'), validateRequest(updateUserStatusOrRoleSchema), UserController.updateUserStatusOrRole)
  .delete(auth('common'), UserController.deleteUserProfile);

export const UserRoutes = router;
