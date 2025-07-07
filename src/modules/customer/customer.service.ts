import { Types } from 'mongoose';
import ICustomer from './customer.interface';
import Customer from './customer.model';

const getCustomer = async (
  userId: Types.ObjectId | string
): Promise<ICustomer | null> => {
  // Logic to get a customer by userId
  const customer = await Customer.findOne({ userId }).lean();
  return customer;
};

const createCustomer = async (data: ICustomer): Promise<ICustomer> => {
  // Logic to create a customer
  const customer = new Customer(data);

  if (!customer) {
    throw new Error('Failed to create customer');
  }

  // Save the customer to the database
  const savedCustomer = await customer.save();

  return savedCustomer;
};

const updateCustomer = async (
  userId: Types.ObjectId | string,
  payload: Partial<ICustomer>
): Promise<any> => {
  try {
    // Find the customer by userId and update the fields
    const updatedCustomer = await Customer.findOneAndUpdate(
      { userId }, // Find customer by userId
      { $set: payload }, // Update fields
      { new: true } // Return the updated document
    ).lean();

    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }

    return updatedCustomer;
  } catch (error: unknown) {
    // Type assertion here
    if (error instanceof Error) {
      throw new Error(`Error updating customer: ${error.message}`);
    } else {
      throw new Error('Unknown error occurred during customer update');
    }
  }
};

export const CustomerService = {
  getCustomer,
  createCustomer,
  updateCustomer,
};
