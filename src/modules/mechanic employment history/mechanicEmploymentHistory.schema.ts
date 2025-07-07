import mongoose, { Schema } from 'mongoose';
import IMechanicEmploymentHistory from './mechanicEmploymentHistory.interface';
import { UserPlatform } from '../user/user.constant';

const MechanicEmploymentHistorySchema = new Schema<IMechanicEmploymentHistory>(
  {
    companyName: {
      type: String,
      required: true,
    },
    jobName: {
      type: String,
      required: true,
    },
    supervisorsName: {
      type: String,
      required: true,
    },
    supervisorsContact: {
      type: String,
      required: true,
    },
    durationFrom: {
      type: Date,
      required: true,
    },
    durationTo: {
      type: Date,
      required: true,
    },
    platform: {
      type: String,
      enum: {
        values: Object.values(UserPlatform), // Use enum values properly
        message: '{VALUE} is not a valid platform', // Correct placement of error message
      },
      required: [true, 'Platform is required'],
    },
    reason: {
      type: String,
      required: true,
    },
  },
  {
    //timestamps: true,
  }
);


export default MechanicEmploymentHistorySchema;
