import { Types } from 'mongoose';

interface ISetting {
  _id: Types.ObjectId;
  key: string;
  name: string;
  value: any;
}

export default ISetting;
