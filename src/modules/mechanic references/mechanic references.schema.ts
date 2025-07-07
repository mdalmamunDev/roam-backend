import mongoose, { Schema } from 'mongoose';
import { MechanicRelations } from './mechanic references.interface';
import IMechanicReferences from './mechanic references.interface';

const MechanicReferenceSchema = new Schema<IMechanicReferences>(
  {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    relation: {
      type: String,
      enum: Object.values(MechanicRelations), // Use enum values properly
      required: [true, 'Platform is required'],
      message: '{VALUE} is not a valid platform', // Correct placement of the error message
    },
  },
  {
    //timestamps: true,
    _id: false,
  }
);
export default MechanicReferenceSchema;
