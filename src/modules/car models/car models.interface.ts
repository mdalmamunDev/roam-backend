import { Types } from 'mongoose';

interface ICarModel {
  adminId: Types.ObjectId;
  name: string;
}

export default ICarModel;
