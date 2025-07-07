import { z } from 'zod';
import { UserValidation } from '../user/user.validation';
import { UserPlatform } from '../user/user.constant';
import { objectId, phoneValidation } from '../../helpers/zValidationUtil';

// Platform validation
const platform = z.enum(UserPlatform as [string, ...string[]], {
  errorMap: () => ({ message: `Platform must be one of [${UserPlatform.join(', ')}].` }),
});
const haveLicense = z.boolean().optional();
const haveCdl = z.boolean().optional();
const whyOnSite = z.string().optional();

const employmentHistories = z.array(
  z.object({
    companyName: z.string().min(1, 'Company name cannot be empty.'),
    jobName: z.string().min(1, 'Job name cannot be empty.'),
    supervisorsName: z.string().optional(),
    supervisorsContact: phoneValidation.optional(),
    durationFrom: z.string().
      refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format.',
      }).optional(),
    durationTo: z.string().
      refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format.',
      }).optional(),
    platform,
    reason: z.string().optional(),
  })
).optional();
const experiences = z.array(
  z.object({
    experienceId: objectId,
    platform: platform,
    time: z
      .number()
      .positive('Time must be a positive number.')
      .int('Time must be an integer.'),
  })
).optional();

const haveOwnTools = z.boolean().optional();
const tools = z.array(objectId).optional();
const toolsCustom = z.array(
  z.string({
    required_error: 'Custom tool name must be a string.',
    invalid_type_error: 'Custom tool name must be a string.',
  })
).optional();

const certifications = z.array(z.string()).optional();
const references = z.array(
  z.object({
    name: z.string().min(1, 'Reference name cannot be empty.'),
    phone: phoneValidation,
    relation: z.string().min(1, 'Relation cannot be empty.'),
  })
).optional();

const resume = z.string().optional();
const certificate = z.string().optional();

const MechanicValidation = {
  platform,
  haveLicense,
  haveCdl,
  experiences,
  certifications,
  haveOwnTools,
  tools,
  toolsCustom,
  employmentHistories,
  references,
  resume,
  certificate,
};
export default MechanicValidation;




// Reusable validation for mechanicId
export const validBasicInfo = z.object({
  body: z.object({
    profileImage: UserValidation.profileImage,
    name: UserValidation.name.optional(),
    platform,
    phone: UserValidation.phone,
    address: UserValidation.address,
    haveLicense,
    haveCdl,
  }).strict(),
});

export const validExperienceCertifications = z.object({
  body: z.object({
    experiences,
    certifications,
  }).strict(),
});

export const validToolsCustomization = z.object({
  body: z.object({
    tools,
    toolsCustom,
  }).strict(),
});

export const validEmploymentHistory = z.object({
  body: z.object({
    employmentHistories
  }).strict(),
});

export const validReferences = z.object({
  body: z.object({
    references
  }).strict(),
});

export const validWhyOnSite = z.object({
  body: z.object({
    whyOnSite
  }).strict(),
});

export const validResumeCertificate = z.object({
  body: z.object({
    resume,
    certificate,
  }).strict(),
});
