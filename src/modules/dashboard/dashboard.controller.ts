import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payment/payment.service';
import { BalanceService } from '../balance/balance.service';
import { SettingService } from '../settings/settings.service';
import { PromoService } from '../promo/promo.service';

// get all Tools
class Controller {
  getDashboard = catchAsync(async (req, res) => {
    const { recentLimit = '20', year, month } = req.query;

    const [totalUsers, totalProvider, recentUsers, chargeBalance, totalWithdrawal, appBalance, earningChart, recentPromos] = await Promise.all([
      UserService.getTotalUsers('user'),
      UserService.getTotalUsers('provider'),
      UserService.getRecentUsers(parseInt(recentLimit as string, 10)),
      BalanceService.getChargeBalance(),
      PaymentService.getTotalWithdrawal(),
      BalanceService.getAppBalance(),
      PaymentService.getEarningsDataForYear(Number(year)),
      PromoService.getRecentPromos(parseInt(recentLimit as string, 10)),
    ]);

    sendResponse(res, { code: StatusCodes.OK, data: { totalUsers, totalProvider, recentUsers, recentPromos, chargeBalance, totalWithdrawal, appBalance, earningChart} });
  });

  getEarnings = catchAsync(async (req, res) => {
    const [
      totalEarnings,
      appBalance,
      totalWithdrawal,
      payments,
    ] = await Promise.all([
      BalanceService.getChargeBalance(),
      BalanceService.getAppBalance(),
      PaymentService.getTotalWithdrawal(),
      PaymentService.getAll(req),
    ]);


    sendResponse(res, { code: StatusCodes.OK, data: { totalEarnings, appBalance, totalWithdrawal, payments: payments.results }, pagination: payments.pagination });
  });
  getWithdraw = catchAsync(async (req, res) => {
    const [
      totalEarnings,
      appBalance,
      totalWithdrawal,
      payments,
    ] = await Promise.all([
      BalanceService.getChargeBalance(),
      BalanceService.getAppBalance(),
      PaymentService.getTotalWithdrawal(),
      PaymentService.getAllWithdraw(req),
    ]);


    sendResponse(res, { code: StatusCodes.OK, data: { totalEarnings, appBalance, totalWithdrawal, payments: payments.results }, pagination: payments.pagination });
  });
  getTransactions = catchAsync(async (req, res) => {
    const [
      settings,
      transactions,
    ] = await Promise.all([
      SettingService.get('transaction-transfer-hours'),
      PaymentService.getAllTransactions(req),
    ]);


    sendResponse(res, { code: StatusCodes.OK, data: { defaultTimeHour: settings?.value, transactions: transactions.results }, pagination: transactions.pagination });
  });
}

const DashboardController = new Controller();
export default DashboardController;
