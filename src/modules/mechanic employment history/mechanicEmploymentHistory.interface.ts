import { TUserPlatform } from '../user/user.constant';

interface IMechanicEmploymentHistory {
  companyName: string;
  jobName: string;
  supervisorsName: string;
  supervisorsContact: string;
  durationFrom: Date;
  durationTo: Date;
  platform: TUserPlatform;
  reason: string;
}

export default IMechanicEmploymentHistory;
