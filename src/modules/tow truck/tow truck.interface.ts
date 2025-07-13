import { Types } from 'mongoose';
import { TGender } from '../user/user.constant';

interface ITowTruck {
  userId: Types.ObjectId;
  towTypeId: Types.ObjectId;
  companyName: string;
  gender: TGender;
  description: string;
  nidNo : string;
  nidFront : string;
  nidBack : string;
  drivingLicenseNo : string;
  drivingLicenseFront : string;
  drivingLicenseBack : string;
  carRegistrationNo : string;
  carRegistrationFront : string;
  carRegistrationBack : string;
  driverImage : string;
  carImage : string;
  isVerified: boolean,
  isOnline: boolean,
  createdAt: Date;
  updatedAt: Date;
}

export default ITowTruck;
