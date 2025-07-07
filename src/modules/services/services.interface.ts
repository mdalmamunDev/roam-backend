import { Types } from 'mongoose';

interface IService {
  adminId: Types.ObjectId;
  name: string;
}

export default IService;
