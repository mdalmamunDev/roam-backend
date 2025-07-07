import { z } from 'zod';
import { JobStatus } from './jobs.interface';
import { coordinatesValidation, dateValidation, objectId, platformValidation } from '../../helpers/zValidationUtil';


// Define GeoLocation Validation
const time = z.string().optional();
const date = dateValidation.optional();

// ObjectId validation (for customerId, carModelId, targets)

// targets
const targets = z.array(objectId).nonempty('At least one target is required.');

// Job status validation (one of 'active', 'process', 'completed', 'blocked')
const status = z.enum(JobStatus as [string, ...string[]], {
  errorMap: () => ({ message: `Status must be one of [${JobStatus.join(', ')}].` }),
});

// Validation schema for IJob
export const JobValidation = {
  customerId: objectId,
  carModelId: objectId,
  platform: platformValidation,
  targets,
  time,
  date,
  isDeleted: z.boolean(),
  status,
};

export default JobValidation;


export const validCreate = z.object({
  body: z.object({
    platform: platformValidation,
    targets,
    coordinates: coordinatesValidation.optional(),
    time,
    date,
    carModelId: objectId,
  }).strict(),
});
export const validCreateTT = z.object({
  body: z.object({
    targets,
    coordinates: coordinatesValidation.optional(),
    destCoordinates: coordinatesValidation,
  }).strict(),
});

export const validUpdate = z.object({
  body: z.object({
    platform: platformValidation.optional(),
    targets: targets.optional(),
    carModelId: objectId.optional(),
    status: status.optional(),
  }).strict(),
});