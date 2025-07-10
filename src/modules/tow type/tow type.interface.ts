import { Types } from 'mongoose';

interface ITowType {
  _id: Types.ObjectId;
  name: string;
  baseFare: number;
  perKM: number;
  charge: number;
}

export default ITowType;
