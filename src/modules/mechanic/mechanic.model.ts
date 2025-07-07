import mongoose, { Schema } from 'mongoose';
import { UserPlatform } from '../user/user.constant';
import IMechanic from './mechanic.interface';
import MechanicExperienceSchema from '../mechanic  experiences/mechanic  experiences.schema';
import MechanicReferenceSchema from '../mechanic references/mechanic references.schema';
import MechanicEmploymentHistorySchema from '../mechanic employment history/mechanicEmploymentHistory.schema';

const mechanicSchema = new Schema<IMechanic>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      enum: Object.values(UserPlatform), // Use enum values properly
      required: [true, 'Platform is required'],
      message: '{VALUE} is not a valid platform', // Correct placement of the error message
    },
    haveLicense: {
      type: Boolean,
    },
    haveCdl: {
      type: Boolean,
    },
    whyOnSite: {
      type: String,
    },
    employmentHistories: {
      type: [MechanicEmploymentHistorySchema],
      default: [],
    },
    experiences: {
      type: [MechanicExperienceSchema],
      default: [],
    },
    haveOwnTools: {
      type: Boolean,
      default: false,
    },
    tools: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tool',
      },
    ],
    toolsCustom: [
      {
        type: String,
      },
    ],
    certifications: [
      {
        type: String,
      },
    ],
    references: {
      type: [MechanicReferenceSchema],
      default: [],
    },
    resume: {
      type: String,
    },
    certificate: {
      type: String,
    },

  },
  {
    //timestamps: true,
  }
);

const Mechanic = mongoose.model<IMechanic>('Mechanic', mechanicSchema);
export default Mechanic;
