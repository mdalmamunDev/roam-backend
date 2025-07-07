import mongoose, { Schema } from 'mongoose';
import ICarModel from './car models.interface';

const schema = new Schema<ICarModel>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Car model name is required'],
    },
  },
  {
    timestamps: true,
  }
);

const CarModel = mongoose.model<ICarModel>('Car Model', schema);
export default CarModel;
