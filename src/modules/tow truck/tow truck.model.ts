import mongoose, { Schema } from 'mongoose';
import ITowTruck from './tow truck.interface';
import TTVehicleSchema from '../tt vehicle/tt vehicle.schema';

const towTruckSchema = new Schema<ITowTruck>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ppm: {
      type: Number,
      required: true,
    },
    llc: {
      type: String,
    },
    companyName: {
      type: String,
    },
    companyOwner: {
      type: String,
    },
    companyPhone: {
      type: String,
    },
    companyEmail: {
      type: String,
    },
    companyAddress: {
      type: String,
    },
    yearsInBusiness: {
      type: Number,
    },
    website: {
      type: String,
    },
    totalTows: {
      type: Number,
    },
    einNo: {
      type: String,
    },
    usDotNo: {
      type: String,
    },
    usDotFile: {
      type: String,
    },
    policyNo: {
      type: String,
    },
    policyLimit: {
      type: Number,
    },
    policyFile: {
      type: String,
    },
    mcNo: {
      type: String,
    },
    mcFile: {
      type: String,
    },
    vehicles: {
      type: [TTVehicleSchema],
      default: [],
    },
    services: {
      type: [String], // Array of strings for services offered
    },
    primaryCity: {
      type: String,
    },
    primaryCountry: {
      type: String,
    },
    regionsCovered: {
      type: String,
    },
    emergency24_7: {
      type: Boolean,
    },
    eta: {
      type: String, // ETA (estimated time of arrival)
    },
    authName: {
      type: String,
    },
    authTitle: {
      type: String,
    },
    authSignature: {
      type: String, // Image path for the signature
    },
    authDate: {
      type: String, // Store day, month, and year
    },
  },
  {
    timestamps: true,
  }
);

const TowTruck = mongoose.model<ITowTruck>('Tow Truck', towTruckSchema);
export default TowTruck;
