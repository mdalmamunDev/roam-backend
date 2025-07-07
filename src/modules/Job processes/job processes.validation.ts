import { z } from 'zod';
import { JobProcessStatus } from './job processes.interface';
import { objectId } from '../../helpers/zValidationUtil';

const services = z.array(
  z.object({
    serviceId: objectId,
    amount: z.number().positive('Amount must be a positive number.'),
  })
);

const rating = z.number().min(1, 'Rating must be between 1 and 5.').max(5, 'Rating must be between 1 and 5.');
const comment = z.string().optional();
const status = z.enum(JobProcessStatus as [string, ...string[]]);

// Job process schema
const JobProcessValidation = z.object({
  providerId: objectId,  // Validating providerId as ObjectId
  jobId: objectId,  // Validating jobId as ObjectId
  customerId: objectId,  // Validating customerId as ObjectId
  services,  // Validating array of services
  status,  // Validating status from predefined list
  rating,  // Validating rating between 1 and 5
  comment,  // Validating comment as optional string
});

export default JobProcessValidation


export const validCreate = z.object({
  body: z.object({
    jobId: objectId,
  }).strict(),
});

export const validUpdateStatus = z.object({
  body: z.object({
    status
  }).strict(),
});

export const validServices = z.object({
  body: services,
});

export const validFeedback = z.object({
  body: z.object({
    rating,
    comment,
  }).strict(),
});