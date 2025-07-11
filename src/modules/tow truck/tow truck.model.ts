import mongoose, { Schema } from 'mongoose';
import ITowTruck from './tow truck.interface';
import { Gender } from '../user/user.constant';

const towTruckSchema = new Schema<ITowTruck>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    towTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'TowType',
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: Gender,
      required: true,
    },
    description: {
      type: String,
    },
    nidNo: {
      type: String,
    },
    nidFront: {
      type: String,
    },
    nidBack: {
      type: String,
    },
    drivingLicenseNo: {
      type: String,
    },
    drivingLicenseFront: {
      type: String,
    },
    drivingLicenseBack: {
      type: String,
    },
    carRegistrationNo: {
      type: String,
    },
    carRegistrationFront: {
      type: String,
    },
    carRegistrationBack: {
      type: String,
    },
    driverImage: {
      type: String,
    },
    carImage: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const TowTruck = mongoose.model<ITowTruck>('TowTruck', towTruckSchema);
export default TowTruck;
