import { z } from 'zod';
import { objectId } from '../../helpers/zValidationUtil';
import { ReportStatus } from './report.interface';

// Reusable validation for mechanicId
class Valid {
  create = z.object({
    body: z.object({
      providerId: objectId,
      jobId: objectId,
      reason: z.string(),
    }).strict(), // Ensures no additional properties are allowed
  });

  action = z.object({
    body: z.object({
      status: z.enum(ReportStatus as [string])
    }).strict(), // Ensures no additional properties are allowed
  });
}


export const ValidReport = new Valid()


