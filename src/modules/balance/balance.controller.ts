
// update or create a balance
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import Balance from './balance.model';
import { BalanceService } from './balance.service';


// get a balance by key
const get = catchAsync(async (req: Request, res: Response) => {
  let balance = await Balance.find();

  // Ensure there are at least 2 balance entries, create them if missing
  if (balance.length < 2) {
    await Promise.all([
      BalanceService.addAppBalance(0),
      BalanceService.addChargeBalance(0),
    ]);
    balance = await Balance.find();
  }

  const result: Record<string, any> = {};

  // Safely assign balances if they exist
  balance.forEach((item) => {
    if (item?.key) {
      result[item.key] = item.value;
    }
  });

  sendResponse(res, { code: StatusCodes.OK, message: 'Balance retrieved successfully', data: result });
});

export const BalanceController = {
  get,
};
