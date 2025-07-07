import { Types } from 'mongoose';
import { TUserPlatform } from '../user/user.constant';

interface IMechanicExperience {
  experienceId: Types.ObjectId;
  platform: TUserPlatform;
  time: number;
}

export default IMechanicExperience;
