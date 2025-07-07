import { Types } from 'mongoose';
import { TUserPlatform } from '../user/user.constant';
import IMechanicExperience from '../mechanic  experiences/mechanic  experiences.interface';
import IMechanicReferences from '../mechanic references/mechanic references.interface';
import IMechanicEmploymentHistory from '../mechanic employment history/mechanicEmploymentHistory.interface';

interface IMechanic {
  userId: Types.ObjectId;
  platform: TUserPlatform;
  haveLicense: boolean;
  haveCdl: boolean;
  whyOnSite: string;
  experiences: IMechanicExperience[];
  haveOwnTools: boolean;
  tools: Types.ObjectId[];
  toolsGroup: any,
  toolsCustom: string[];
  certifications: string[];
  references: IMechanicReferences[];
  employmentHistories: IMechanicEmploymentHistory[];
  resume: string;
  certificate: string;
}

export default IMechanic;
