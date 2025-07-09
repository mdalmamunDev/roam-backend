import { z } from 'zod';
// import { Role, Roles } from '../../middlewares/roles';
import { use } from 'i18next';
import { Role, UserRole as Roles, TUserStatus, UserRole, UserStatus } from './user.constant';
import { phoneValidation } from '../../helpers/zValidationUtil';

const name = z.string({
  required_error: 'Name is required.',
  invalid_type_error: 'Name must be a string.',
}).min(1, 'Name cannot be empty.');

const email = z.string({
  required_error: 'Email is required.',
  invalid_type_error: 'Email must be a string.',
}).email('Invalid email address.');

const password = z.string({
  required_error: 'Password is required.',
  invalid_type_error: 'Password must be a string.',
}).min(8, 'Password must be at least 8 characters long.');

const role = z.enum(UserRole as [string, ...string[]], {
  invalid_type_error: 'Role must be a valid option.',
  required_error: 'Role is required.',
});

const status = z.enum(UserStatus as [string, ...string[]], {
  invalid_type_error: 'Status must be a valid option.',
  required_error: 'Status is required.',
});

const phone = phoneValidation.optional();

const profileImage = z.string().optional();

const address = z.string().min(1, 'Address cannot be empty.').optional();
const dateOfBirth = z.string().min(1, 'Date of birth cannot be empty.').optional();

export const UserValidation = {
  name,
  profileImage,
  phone,
  address,
  dateOfBirth,
  password,
  role,
}


export const createUserValidationSchema = z.object({
  body: z.object({
    name,
    phone,
    email,
    password,
    confirmPassword: password,
    role,
  }).strict(),
});

export const updateUserValidationSchema = z.object({
  body: z.object({
    name,
    phone,
    address,
    dateOfBirth,
  }),
});

export const updateUserStatusOrRoleSchema = z.object({
  body: z.object({
    role: role.optional(),
    status: status.optional(),
  }),
});