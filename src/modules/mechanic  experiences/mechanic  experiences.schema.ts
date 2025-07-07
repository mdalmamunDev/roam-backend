import  { Schema, Types } from 'mongoose';
import { UserPlatform } from '../user/user.constant';

const MechanicExperienceSchema = new Schema(
  {
    experienceId: {
      type: Types.ObjectId,
      ref: 'Experience',
      required: true,
    },
    platform: {
      type: String,
      enum: Object.values(UserPlatform), // Use enum values properly
      required: [true, 'Platform is required'],
      message: '{VALUE} is not a valid platform', // Correct placement of the error message
    },
    time: {
      type: Number,
    },
  }
);

export default MechanicExperienceSchema;
