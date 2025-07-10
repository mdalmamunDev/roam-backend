import { z } from 'zod';
import {JobIssues, JobStatus, JobVehicles } from './jobs.interface';
import { coordinatesValidation, objectId } from '../../helpers/zValidationUtil';

const userId = objectId;
const providerId = objectId.optional();
const vehicle = z.enum(JobVehicles as [string]);
const issue = z.enum(JobIssues as [string]);
const note = z.string().optional();
const distance = z.number().min(0);
const status = z.enum(JobStatus as [string]);

// Validation schema for IJob
export const JobValidation = {
  userId,
  providerId,
  vehicle,
  issue,
  note,
  distance,
  status,
};

export default JobValidation;


export const validCreate = z.object({
  body: z.object({
    vehicle,
    issue,
    note,
    coordinates: coordinatesValidation,
    destCoordinates: coordinatesValidation,
    distance
  }).strict(),
});

export const validBook = z.object({
  body: z.object({
    jobId: objectId,
    providerId: objectId, // required
    promoId: objectId,
  }).strict(),
});