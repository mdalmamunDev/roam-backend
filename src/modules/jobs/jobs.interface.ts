import { Types } from 'mongoose';
import { TGeoLocation } from '../user/user.constant';

export type IJobStatus = 'created' | 'requested' | 'accepted' | 'paid' | 'completed';
export const JobStatus: IJobStatus[] = ['created', 'requested', 'accepted', 'paid', 'completed'];

export type IJobVehicle = 'motor-bike' | 'car' | 'jeep' | 'close_truck' | 'open_truck' | 'other';
export const JobVehicles: IJobVehicle[] = ['motor-bike', 'car', 'jeep', 'close_truck', 'open_truck', 'other'];

export type IJobIssue = 'emergency' | 'jump_start' | 'flat_tire' | 'out_of_fuel' | 'recovery' | 'lockout' | 'other';
export const JobIssues: IJobIssue[] = ['emergency', 'jump_start', 'flat_tire', 'out_of_fuel', 'recovery', 'lockout', 'other'];

interface IJob {
  userId: Types.ObjectId;
  providerId?: Types.ObjectId;
  vehicle: IJobVehicle,
  issue: IJobIssue,
  note?: string,
  fromLocation: TGeoLocation;
  toLocation: TGeoLocation; // for tow trucking
  distance: number,
  status: IJobStatus,
}

export default IJob;
