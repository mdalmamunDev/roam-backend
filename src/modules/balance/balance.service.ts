import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import Balance from './balance.model';
import { IBalanceKey } from './balance.interface';

class Service {
  getChargeBalance = async (): Promise<number> => {
    const balance = await Balance.findOne({ key: 'charge-balance' as IBalanceKey });
    return balance?.value || 0;
  }
  getAppBalance = async (): Promise<number> => {
    const balance = await Balance.findOne({ key: 'app-balance' as IBalanceKey });
    return balance?.value || 0;
  }
  addChargeBalance = async (amount: number): Promise<number> => {
    // Use findOneAndUpdate with upsert to handle both find and create in one operation
    const balance = await Balance.findOneAndUpdate(
      { key: 'charge-balance' as IBalanceKey },  // Search by key
      { $inc: { value: amount } },  // Increment the balance by the amount
      { new: true, upsert: true, setDefaultsOnInsert: true } // Return updated document, create if not found
    );

    if (!balance) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update balance');
    }

    return balance.value;  // Return charge if greater than 1, else return 0
  };

  addAppBalance = async (amount: number): Promise<number> => {
    // Use findOneAndUpdate with upsert to handle both find and create in one operation
    const balance = await Balance.findOneAndUpdate(
      { key: 'app-balance' as IBalanceKey },  // Search by key
      { $inc: { value: amount } },  // Increment the balance by the amount
      { new: true, upsert: true, setDefaultsOnInsert: true } // Return updated document, create if not found
    );

    if (!balance) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update balance');
    }

    return balance.value;  // Return charge if greater than 1, else return 0
  };
}

export const BalanceService = new Service();
