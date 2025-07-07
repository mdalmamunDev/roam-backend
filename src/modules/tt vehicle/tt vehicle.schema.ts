import { Schema } from 'mongoose';
import ITTVehicle from './tt vehicle.interface';
import { TTVehicle } from '../user/user.constant';

const TTVehicleSchema = new Schema<ITTVehicle>({
  year: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  modelNo: {
    type: String,
    required: true,
  },
  gvwr: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: TTVehicle,
    required: true,
  },
  video: {
    type: String,
    required: false, // Optional field
  },
}, { _id: false });

export default TTVehicleSchema;
