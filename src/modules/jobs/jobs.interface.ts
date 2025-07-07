import { Types } from 'mongoose';
import { TGeoLocation, TUserPlatform } from '../user/user.constant';

export type IJobStatus = 'active' | 'process' | 'completed';
export const JobStatus: IJobStatus[] = ['active', 'process', 'completed'];

interface IJob {
  customerId: Types.ObjectId;
  carModelId: Types.ObjectId;
  platform: TUserPlatform;
  targets: Types.ObjectId[];
  location: TGeoLocation;
  destination: TGeoLocation; // for tow trucking
  time: string; // for in shope
  date: string; // for in shope
  isDeleted: boolean;
  status: IJobStatus;
}

export default IJob;
