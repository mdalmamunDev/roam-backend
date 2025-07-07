import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { updateUserStatusOrRoleSchema, updateUserValidationSchema, UserValidation } from './user.validation';

const router = express.Router();

// router.route('/profile-image').post(
//   auth('common'),
//   // upload.single('profile_image'),
//   convertHeicToPngMiddleware(UPLOADS_FOLDER),
//   UserController.updateProfileImage
// );
// sub routes must be added after the main routes
// router
//   .route('/profile')
//   .get(auth('common'), UserController.getMyProfile)
// .patch(
//   auth('common'),
//   validateRequest(UserValidation.updateUserValidationSchema),
//   // upload.single('profile_image'),
//   convertHeicToPngMiddleware(UPLOADS_FOLDER),
//   UserController.updateMyProfile
// )
// .delete(auth('common'), UserController.deleteMyProfile);

//main routes
router.get('/', auth('admin'), UserController.getAllUsers);

// user location
// router.get('/location/:id', auth('common'), UserController.getUserLocation); // we can't use userId because of the middleware. It has own logics
// router.put('/location', auth('common'), UserController.updateMyLocation);

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
