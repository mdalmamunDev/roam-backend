import mongoose, { Schema } from 'mongoose';
import ICustomer from './customer.interface';

const customerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filePath: {
      type: String,
    },
  },
  {
    //timestamps: true,
  }
);

const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
export default Customer;
