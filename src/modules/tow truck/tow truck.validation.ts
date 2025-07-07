import { z } from 'zod';
import { UserValidation } from '../user/user.validation';
import { TTVehicle } from '../user/user.constant';

const ppm = z.number().positive('Price per mile must be a positive number.').min(0.01, 'Price per mile must be at least 0.01.');
const llc = z.string().optional();
const companyName = z.string().min(1, 'Company name cannot be empty.');
const companyOwner = z.string().min(1, 'Company owner cannot be empty.');
const companyPhone = z
  .string()
  .min(10, 'Company phone must be at least 10 digits.')
  .max(20, 'Company phone must be at most 20 digits.')
  .regex(/^\+?[0-9\s\-()]+$/, 'Company phone must be a valid phone number.');
const companyEmail = z.string()
  .min(1, 'Company email cannot be empty.')
  .email('Invalid email address.');
const companyAddress = z.string().optional();
const yearsInBusiness = z.number().positive('Years in business must be a positive number.');
const website = z.string().url('Website must be a valid URL.').optional();
const totalTows = z.number().positive('Total tow truck must be a positive number').optional();
const einNo = z.string()
  .regex(/^\d{2}-\d{7}$/, 'EIN must be in the format XX-XXXXXXX.')
  .optional();
const usDotNo = z.string()
  .regex(/^USDOT\d{7,9}$/, 'USDOT Number must be in the format USDOT followed by 7 to 9 digits.')
  .optional();
const usDotFile = z.string().optional();
const policyNo = z.string()
  .regex(/^[A-Z0-9\-]{6,30}$/, 'Policy number must be 6-30 characters, alphanumeric and may include dashes.')
  .optional();
const policyLimit = z.number().positive('Policy limit must be a positive number').optional();
const policyFile = z.string().optional();
const mcNo = z.string()
  .regex(/^MC\d{6}$/, 'MC Number must be in the format MC followed by 6 digits.')
  .optional();
const mcFile = z.string().optional();
const vehicles = z.array(
  z.object({
    year: z.number()
      .min(1900, 'Year must be a valid number between 1900 and the current year.')
      .max(new Date().getFullYear(), `Year must be less than or equal to ${new Date().getFullYear()}`),
    brand: z.string().min(1, 'Brand cannot be empty.'),
    modelNo: z.string().min(1, 'Model number cannot be empty.'),
    gvwr: z.number().positive('GVWR must be a positive number.'),
    type: z.enum(TTVehicle as [string, ...string[]]),
    video: z.string().optional(),
  })
).optional();
const services = z.array(z.string().min(1, 'Service cannot be empty.')).optional();
const primaryCity = z.string().optional();
const primaryCountry = z.string().optional();
const regionsCovered = z.string().optional();
const emergency24_7 = z.boolean().optional();
const eta = z.string().optional();
const authName = z.string().optional();
const authTitle = z.string().optional();
const authSignature = z.string().optional();
const authDate = z.string().optional();

const TowTruckValidation = {
  ppm,
  llc,
  companyName,
  companyOwner,
  companyPhone,
  companyEmail,
  companyAddress,
  website,
  totalTows,
  einNo,
  usDotNo,
  usDotFile,
  policyNo,
  policyLimit,
  policyFile,
  mcNo,
  mcFile,
  vehicles,
  services,
  primaryCity,
  primaryCountry,
  regionsCovered,
  emergency24_7,
  eta,
  authName,
  authTitle,
  authSignature,
  authDate,
};
export default TowTruckValidation;




// Reusable validation for mechanicId
class Valid {
  updateBasicInfo = z.object({
    body: z.object({
      profileImage: UserValidation.profileImage,
      name: UserValidation.name.optional(),
      phone: UserValidation.phone,
      address: UserValidation.address,
      ppm: ppm,
      llc: llc,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateCompanyInfo = z.object({
    body: z.object({
      companyName,
      companyOwner,
      companyPhone,
      companyEmail,
      companyAddress,
      website,
      yearsInBusiness,
      totalTows,
      einNo,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateLicensingCompliance = z.object({
    body: z.object({
      usDotNo,
      usDotFile,
      policyNo,
      policyLimit,
      policyFile,
      mcNo,
      mcFile,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateVehicleEquVer = z.object({
    body: z.object({
      vehicles,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateServiceCovArea = z.object({
    body: z.object({
      services,
      primaryCountry,
      primaryCity,
      regionsCovered,
      emergency24_7,
      eta,
    }).strict(), // Ensures no additional properties are allowed
  });

  updateBusinessReqArg = z.object({
    body: z.object({
      authName,
      authTitle,
      authSignature,
      authDate,
    }).strict(), // Ensures no additional properties are allowed
  });
}


export const ValidTT = new Valid()


