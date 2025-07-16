import { ObjectId, Types } from 'mongoose';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import IPayment from './payment.interface';
import Payment from './payment.model';
import { SettingService } from '../settings/settings.service';
import paymentApi from '../../helpers/paymentApi';
import { User } from '../user/user.model';
import Withdraw from './withdraw/withdraw.model';
import Transaction from './transaction/transaction.model';
import ITransaction, { ITransactionStatus } from './transaction/transaction.interface';
import { NotificationService } from '../notification/notification.services';
import { BalanceService } from '../balance/balance.service';
import { IWithdrawStatus } from './withdraw/withdraw.interface';
import paginate from '../../helpers/paginationHelper';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';


class Service {
  userHistory = async (userId: string | Types.ObjectId) => {
    const user = await User.findById(userId);
    if (!userId || !user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You aren\'t authorized.');
    }

    const userIdStr = userId.toString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all three sources in parallel
    const [transactions, payments, withdraws] = await Promise.all([
      Transaction.find({
        createdAt: { $gte: thirtyDaysAgo },
        $or: [{ userId: userId }, { providerId: userId }],
      })
        .populate('providerId', 'name profileImage')
        .populate('userId', 'name profileImage')
        .lean(),

      Payment.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      }).lean(),

      Withdraw.find({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      }).lean(),
    ]);

    const result: any[] = [];

    // Push formatted transactions
    transactions.forEach((item: any) => {
      const isSender = item.userId?._id?.toString() === userIdStr;
      const receiver = isSender ? item.providerId : item.userId;

      result.push({
        trId: item._id,
        createdAt: item.createdAt,
        amount: isSender ? -Math.abs(item.amount) : item.amount,
        title: (isSender ? 'Send to ' : 'Received from ') + (receiver?.name || 'N/A'),
        image: receiver?.profileImage || 'users/user.png',
        status: item.status,
      });
    });

    // Push formatted payments
    payments.forEach((item: any) => {
      result.push({
        trId: item.trId || 'N/A',
        createdAt: item.createdAt,
        amount: item.amount,
        title: 'Add Balance',
        image: 'defaults/wallet-add.png',
        status: item.status,
      });
    });

    // Push formatted withdraws
    withdraws.forEach((item: any) => {
      result.push({
        trId: item.trId,
        createdAt: item.createdAt,
        amount: -1 * item.amount,
        title: 'Withdraw Balance',
        image: 'defaults/wallet-min.png',
        status: item.status,
      });
    });

    // Sort once at the end
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { wallet: user.wallet || 0, history: result};
  };

  
  getAll = async (req: any) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, keyword } = req.query;

    const filters: any = {};

    // Add status filter if present
    if (status) filters.status = status;

    // Handle keyword search for customerId or providerId (by ObjectId or name)
    if (keyword) {
      filters.$or = [
        // Check if the keyword is a valid ObjectId and filter by customerId or providerId
        ...(Types.ObjectId.isValid(keyword as string) ? [
          { userId: keyword },
        ] : []),
        // At this point, we filter by name after populate, not directly in the query
      ];


      if (keyword.startsWith('pi_')) {
        filters.trId = keyword;
      }
    }

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Payment,
      populate: [
        { path: 'userId', select: 'name email phone' },
      ]
    });

    // After populating, filter by name
    if (keyword && !keyword.startsWith('pi_') && !Types.ObjectId.isValid(keyword as string)) {
      const filteredResults = results.filter((payment: any) => {
        const customerNameMatches = payment.userId?.name?.toLowerCase().includes(keyword.toLowerCase());
        const userEmailMatches = payment.userId?.email?.includes(keyword);
        return customerNameMatches || userEmailMatches;
      });
      return { results: filteredResults, pagination };
    }

    return { results, pagination };
  }
  getAllTransactions = async (req: any) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, isRefundRequested, type, keyword } = req.query;

    const filters: any = {};

    // Add status filter if present
    if (status) filters.status = status;
    if (type) filters.type = type;

    // Add isRefundRequested filter based on boolean values
    if (isRefundRequested !== undefined) {
      filters.isRefundRequested = isRefundRequested === 'true';
    }

    // Handle keyword search for userId or providerId (by ObjectId or name)
    if (keyword) {
      filters.$or = [
        // Check if the keyword is a valid ObjectId and filter by userId or providerId
        ...(Types.ObjectId.isValid(keyword as string) ? [
          { userId: keyword },
          { providerId: keyword },
        ] : []),
        // At this point, we filter by name after populate, not directly in the query
      ];
    }

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Transaction,
      populate: [
        { path: 'userId', select: 'name email phone' },
        { path: 'providerId', select: 'name email phone' },
      ]
    });


    // Add 'ago' field to each transaction
    const resultsWithAgo = results.map((transaction: any) => ({
      ...transaction.toObject(),
      ago: transaction.createdAt ? moment(transaction.createdAt).fromNow() : null,
    }));

    return { results: resultsWithAgo, pagination };
  }
  getAllWithdraw = async (req: any) => {
    const { page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status, keyword } = req.query;

    const filters: any = {};

    // Add status filter if present
    if (status) filters.status = status;


    // Handle keyword search for customerId or providerId (by ObjectId or name)
    if (keyword) {
      if (Types.ObjectId.isValid(keyword as string)) {
        filters.userId = keyword;
      }

      // other filter logic here..
    }

    // Call the paginate function with required parameters
    const { results, pagination } = await paginate({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      filters,
      sortField: sortField as string,
      sortOrder: sortOrder as string,
      model: Withdraw,
      populate: [
        { path: 'userId', select: 'name email phone' },
      ]
    });

    // After populating, filter by name
    if (keyword && !Types.ObjectId.isValid(keyword as string)) {
      const filteredResults = results.filter((withdraw: any) => {
        const nameM = withdraw.userId?.name?.toLowerCase().includes(keyword.toLowerCase());
        const emailM = withdraw.userId?.email?.includes(keyword);
        return nameM || emailM;
      });
      return { results: filteredResults, pagination };
    }

    return { results, pagination };
  }
  get = async (id: Types.ObjectId | string, filters = {}): Promise<any> => {
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'ID is required.')
    }
    const data = await Payment.findOne({ _id: id, ...filters }).populate(['customerId', 'providerId', 'jobId']).lean();
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No payment found.');
    }

    // const actualAmount = data.amount - (data.amount * data.commissionRate) / 100;

    return { ...data };
  };

  // update = async (filters: any, payload: Partial<IPayment>): Promise<IPayment> => {
  //   const data = await Payment.findOneAndUpdate(filters, payload, { new: true }).lean();
  //   if (!data) {
  //     throw new ApiError(StatusCodes.BAD_REQUEST, 'No payment found.');
  //   }

  //   return data;
  // };

  getTotalWithdrawal = async (): Promise<number> => {
    const result = await Withdraw.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return result[0]?.totalAmount || 0;
  };

  createCheckoutSession = async (email: string, amount: number, callback_url: string, metadata: Record<string, any> = {}) => {
    const txRef =  `ref_${uuidv4()}`;

    const payload = {
      email,
      amount: amount * 100, // in kobo
      currency: 'NGN',
      callback_url,
      reference: txRef,
      metadata,
    };

    const response = await paymentApi.post('/transaction/initialize', payload);
    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    };
  }

createTransferRecipient = async ({ name, account_number, bank_code, currency = 'NGN'}: { name: string; account_number: string; bank_code: string; currency?: string; }) => {
  try {
    const response = await paymentApi.post('/transferrecipient', {
      type: 'nuban',
      name,
      account_number,
      bank_code,
      currency,
    });

    return response.data.data.recipient_code; // Save this code
  } catch (err: any) {
    console.error('Paystack createRecipient error:', err.response?.data || err.message);
    throw new ApiError(400, err.response?.data?.message || 'Paystack recipient error');
  }
};

initiateTransfer = async ({ amount, recipient_code, reason }: { amount: number; recipient_code: string; reason?: string; }) => {
  try {
    const response = await paymentApi.post('/transfer', {
      source: 'balance',
      amount: amount*100, // in kobo (e.g. ₦500 => 50000)
      recipient: recipient_code,
      reason,
    });

    return response.data.data;
  } catch(err: any) {
    console.error('Paystack initiateTransfer error:', err.response?.data || err.message);
    throw new ApiError(400, err.response?.data?.message || 'Paystack transfer error');
  }
};



  getEarningsDataForMonth = async (month: number, year: number) => {
    if (!month || month < 1 || month > 12 || !year || year < 1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid month or year provided.');
    }

    const startDate = new Date(year, month - 1, 1); // Start of the month
    const endDate = new Date(year, month, 0); // End of the month (last day)

    const result = await Withdraw.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: 'success' as IWithdrawStatus, // Only successful payments
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$createdAt' }, // Group by day of month
          totalAmount: { $sum: '$charge' }, // Convert cents to dollars
        },
      },
      {
        $sort: { _id: 1 }, // Sort by day of the month
      },
      {
        $project: {
          day: '$_id', // Rename _id to day
          earnings: '$totalAmount', // Rename totalAmount to earnings
          _id: 0, // Remove _id field
        },
      },
    ]);

    return result;  // Array of { day: number, earnings: number }
  };

  getEarningsDataForYear = async (year: number) => {
    if (!year || year < 1) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid year provided.');
    }

    const startDate = new Date(year, 0, 1); // Jan 1st
    const endDate = new Date(year + 1, 0, 1); // Jan 1st next year (exclusive upper bound)

    const result = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: 'received' as ITransactionStatus,
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' }, // Group by month (1-12)
          totalAmount: { $sum: '$charge' },
        },
      },
      {
        $project: {
          month: '$_id',
          earnings: '$totalAmount',
          _id: 0,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    // Fill missing months with 0 earnings
    const earningsByMonth: { month: string; earnings: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 1; i <= 12; i++) {
      const monthData = result.find((m) => m.month === i);
      earningsByMonth.push({
        month: monthNames[i - 1],
        earnings: monthData ? monthData.earnings : 0,
      });
    }

    return earningsByMonth; // [{ month: 'Jan', earnings: 123 }, ...]
  };


  transferBalance = async (payload: Partial<ITransaction>): Promise<ITransaction> => {
    if (!payload.amount || payload.amount < 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Amount cannot be negative.');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found.');
    }
    if (user.wallet < payload.amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient balance. Please add some balance to your wallet.');
    }

    const transaction = await Transaction.create(payload);
    if (!transaction) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create transaction.');
    }

    user.wallet -= payload.amount;
    await user.save();

    // send notification to provider
    await NotificationService.addNotification({
      receiverId: payload.providerId?.toString(),
      title: 'Balance Transferred',
      message: `You have received $${payload.amount} from a ${user.name}. This amount will add your wallet soon.`,
    });

    return transaction;
  }

  transferToProviderAll = async (): Promise<number> => {
    // Find all transactions to providers that are not yet successful
    const settings = await SettingService.get('transaction-transfer-hours');
    const hoursAgo = Number(settings?.value); // Default to 24 hours if not set
    let match: any = {
      providerId: { $exists: true },
      status: 'created' as ITransactionStatus,
    };
    if (hoursAgo && hoursAgo > 0) {
      const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      match.createdAt = { $lte: cutoffDate };
    }
    const transactions = await Transaction.find(match).lean();

    if (!transactions.length) return 0; // No transactions to process

    // Fetch all unique providerIds
    const providerIds = [...new Set(transactions.map(tx => tx.providerId?.toString()))];
    const providers = await User.find({ _id: { $in: providerIds } }).lean();

    // Map providerId to provider for quick lookup
    const providerMap = new Map(providers.map(p => [p._id.toString(), p]));

    // Prepare bulk operations for users and transactions
    const userBulkOps = [];
    const txBulkOps = [];
    const notifications = [];

    for (const tx of transactions) {
      const provider = providerMap.get(tx.providerId?.toString());
      if (provider) {
        // add the amount to provider's wallet
        userBulkOps.push({
          updateOne: {
            filter: { _id: provider._id },
            update: { $inc: { wallet: tx.amount } }
          }
        });

        // update the transaction status to success
        txBulkOps.push({
          updateOne: {
            filter: { _id: tx._id },
            update: { $set: { status: 'success' as ITransactionStatus, isRefundRequested: false } }
          }
        });

        // send notification to provider
        notifications.push(NotificationService.addNotification({
          receiverId: provider._id.toString(),
          title: 'Balance Added to Wallet',
          message: `$${tx.amount} added to your wallet from ${tx.userId}.`,
        }));
      }
    }

    if (userBulkOps.length) await User.bulkWrite(userBulkOps);
    if (txBulkOps.length) await Transaction.bulkWrite(txBulkOps);
    await Promise.all(notifications);

    // return the count of transactions processed
    return transactions.length;
  }

}

export const PaymentService = new Service();
