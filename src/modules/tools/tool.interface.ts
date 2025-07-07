import { Types } from 'mongoose';

interface ITool {
  adminId: Types.ObjectId;
  name: string;
  group: string;
}

export default ITool;
