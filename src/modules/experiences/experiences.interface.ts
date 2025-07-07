import { Types } from 'mongoose';

interface IExperience {
  adminId: Types.ObjectId;
  name: string;
}

export default IExperience;
