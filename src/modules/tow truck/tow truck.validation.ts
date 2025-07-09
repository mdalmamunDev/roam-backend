import { z } from 'zod';
import { UserValidation } from '../user/user.validation';
import { Gender } from '../user/user.constant';

// 🔁 Reusable fields
const userId = z.string().length(24, 'Invalid user ID');
const towTypeId = z.string().length(24, 'Invalid tow type ID');
const companyName = z.string().min(2, 'Company name is required');
const dateOfBirth = z.string().min(1, 'Date of birth is required');
const gender = z.enum(Gender as [string]);
const description = z.string().min(1, 'Description is required');

const nidNo = z.string().min(5, 'NID No is required');
const nidFont = z.string().min(1, 'Invalid front NID image URL');
const nidBack = z.string().min(1, 'Invalid back NID image URL');

const drivingLicenseNo = z.string().min(5, 'License number is required');
const drivingLicenseFont = z.string().min(1, 'Invalid front license image URL');
const drivingLicenseBack = z.string().min(1, 'Invalid back license image URL');

const carRegistrationNo = z.string().min(3, 'Car registration number is required');
const carRegistrationFont = z.string().min(1, 'Invalid front car registration image URL');
const carRegistrationBack = z.string().min(1, 'Invalid back car registration image URL');

const driverImage = z.string().min(1, 'Invalid driver image URL');
const carImage = z.string().min(1, 'Invalid car image URL');

// 🧩 Base object
const TowTruckValidation = {
  userId,
  towTypeId,
  companyName,
  dateOfBirth,
  gender,
  description,
  nidNo,
  nidFont,
  nidBack,
  drivingLicenseNo,
  drivingLicenseFont,
  drivingLicenseBack,
  carRegistrationNo,
  carRegistrationFont,
  carRegistrationBack,
  driverImage,
  carImage,
};
export default TowTruckValidation;




// Reusable validation for mechanicId
class Valid {
  completeProfile = z.object({
    body: z.object({
      profileImage: UserValidation.profileImage,
      companyName,
      address: UserValidation.address,
      towTypeId,
      dateOfBirth,
      gender,
      description,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateNid = z.object({
    body: z.object({
      nidNo,
      nidFont,
      nidBack,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateDrivingLicense = z.object({
    body: z.object({
      drivingLicenseNo,
      drivingLicenseFont,
      drivingLicenseBack,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateCarRegistration = z.object({
    body: z.object({
      carRegistrationNo,
      carRegistrationFont,
      carRegistrationBack,
    }).strict(), // Ensures no additional properties are allowed
  });
}


export const ValidTT = new Valid()


