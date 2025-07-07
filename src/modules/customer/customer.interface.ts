import { Types } from 'mongoose';

interface ICustomer {
  userId: Types.ObjectId;
  filePath: String;
}

export default ICustomer;
