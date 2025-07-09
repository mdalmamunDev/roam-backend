import { Types } from 'mongoose';
import { TGender } from '../user/user.constant';

interface ITowTruck {
  userId: Types.ObjectId;
  towTypeId: Types.ObjectId;
  companyName: string;
  dateOfBirth: string;
  gender: TGender;
  description: string;
  nidNo : string;
  nidFont : string;
  nidBack : string;
  drivingLicenseNo : string;
  drivingLicenseFont : string;
  drivingLicenseBack : string;
  carRegistrationNo : string;
  carRegistrationFont : string;
  carRegistrationBack : string;
  driverImage : string;
  carImage : string;
  createdAt: Date;
  updatedAt: Date;
}

export default ITowTruck;
