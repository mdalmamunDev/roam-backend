import { ObjectId, Types } from 'mongoose';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import IPayment from './payment.interface';
import Payment from './payment.model';
import { SettingService } from '../settings/settings.service';
import payment from '../../helpers/payment';
import { User } from '../user/user.model';
import Withdraw from './withdraw/withdraw.model';
import Transaction from './transaction/transaction.model';
import ITransaction, { ITransactionStatus } from './transaction/transaction.interface';
import { NotificationService } from '../notification/notification.services';
import { BalanceService } from '../balance/balance.service';
import { IWithdrawStatus } from './withdraw/withdraw.interface';
import paginate from '../../helpers/paginationHelper';
import moment from 'moment';

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
        $or: [{ customerId: userId }, { providerId: userId }],
      })
        .populate('providerId', 'name profileImage')
        .populate('customerId', 'name profileImage')
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
      const isSender = item.customerId?._id?.toString() === userIdStr;
      const receiver = isSender ? item.providerId : item.customerId;

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
        trId: item._id,
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

    // Handle keyword search for customerId or providerId (by ObjectId or name)
    if (keyword) {
      filters.$or = [
        // Check if the keyword is a valid ObjectId and filter by customerId or providerId
        ...(Types.ObjectId.isValid(keyword as string) ? [
          { customerId: keyword },
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
        { path: 'customerId', select: 'name email phone' },
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

  store = async (userId: string | ObjectId, sessionId: string) => {
    // if (!userId) {
    //   throw new ApiError(StatusCodes.UNAUTHORIZED, 'You aren\'t authorized.');
    // }
    // if (!sessionId) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, "Payment session id is required.");
    // }

    // const paymentIntent = await payment.checkout.sessions.retrieve(sessionId);
    // if (!paymentIntent) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, "Payment Intent not found.");
    // }

    // if (paymentIntent.amount_total == null) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, "Payment Intent amount_total is missing.");
    // }
    // const data = await Payment.create({ sessionId, userId: userId, amount: paymentIntent.amount_total / 100 }); // in $dollar
    // if (!data) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to store payment information.')
    // }

    // return data;
  }

  update = async (filters: any, payload: Partial<IPayment>): Promise<IPayment> => {
    const data = await Payment.findOneAndUpdate(filters, payload, { new: true }).lean();
    if (!data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No payment found.');
    }

    return data;
  };

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
    const txRef = `ref-${Date.now()}`;

    const payload = {
      email,
      amount: amount * 100, // in kobo
      currency: 'NGN',
      callback_url,
      reference: txRef,
      metadata,
    };

    const response = await payment.post('/transaction/initialize', payload);
    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
    };
  }

  withdrawReq = async (amount: number, userId: string | ObjectId, refresh_url: string, return_url: string) => {
    // if (!userId) {
    //   throw new ApiError(StatusCodes.UNAUTHORIZED, "You aren't authorized.");
    // }

    // const session = await Withdraw.startSession();
    // session.startTransaction();
    // try {
    //   const user = await User.findById(userId).session(session);
    //   if (!user) {
    //     throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
    //   }

    //   const wResult = await Withdraw.aggregate([
    //     {
    //       $match: {
    //         userId: new Types.ObjectId(user._id),
    //         status: 'pending',
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: null,
    //         totalSum: {
    //           $sum: { $add: ['$amount', '$charge'] },  // sum of amount + charge
    //         },
    //       },
    //     },
    //   ]).session(session);

    //   const totalPending = wResult.length > 0 ? wResult[0].totalSum : 0;

    //   const charge = await SettingService.commissionAmount(amount);
    //   if (user.wallet - totalPending < amount + charge) {
    //     const required = amount + charge;
    //     throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient balance. Available: ${user.wallet} - ${totalPending} (pending withdraw), required: ${required} (${amount} + ${charge} charge)`);
    //   }

    //   // Ensure user has a Stripe account (sid)
    //   if (!user.sid) {
    //     const account = await payment.accounts.create({ type: 'express', email: user.email });
    //     user.sid = account.id;
    //     await user.save({ session });
    //   }

    //   const accountInfo = await payment.accounts.retrieve(user.sid);
    //   if (!accountInfo.capabilities || accountInfo.capabilities.transfers !== 'active') {
    //     const accountLink = await payment.accountLinks.create({
    //       account: user.sid,
    //       refresh_url,
    //       return_url,
    //       type: 'account_onboarding',
    //     });
    //     await session.abortTransaction();
    //     session.endSession();
    //     return { url: accountLink.url, refresh_url, success_url: return_url };
    //   }

    //   // Deduct the amount + charge from user's wallet atomically
    //   user.wallet -= (amount + charge);
    //   await user.save({ session });

    //   // store the withdrawal
    //   const withdraw = await Withdraw.create([{ userId, amount, charge }], { session });
    //   if (!withdraw || !withdraw[0]) {
    //     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create withdrawal request.');
    //   }

    //   await session.commitTransaction();
    //   session.endSession();

    //   return withdraw[0];
    // } catch (error) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   throw error;
    // }
  };

  withdrawAdminRes = async (withDrawId: string, status: IWithdrawStatus) => {
    // if (!withDrawId) {
    //   throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid withdrawal request ID.");
    // }
    // const withDraw = await Withdraw.findById(withDrawId);
    // if (!withDraw || withDraw.status === 'success') {
    //   throw new ApiError(StatusCodes.NOT_FOUND, "No withdraw request found or already withdraw success.");
    // }

    // // handle cancel
    // if (status === 'canceled') {
    //   withDraw.status = status;
    //   await withDraw.save();
    //   return withDraw;
    // }

    // const user = await User.findById(withDraw.userId);
    // if (!user) {
    //   throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
    // }

    // let accountInfo;
    // try {
    //   accountInfo = await payment.accounts.retrieve(user.sid);
    // } catch (error) {
    //   throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve account information.");
    // }
    // if (!accountInfo.capabilities || accountInfo.capabilities.transfers !== 'active') {
    //   throw new ApiError(StatusCodes.PAYMENT_REQUIRED, "Get bank information from user first.");
    // }

    // let transfer = await payment.transfers.create({
    //   amount: withDraw.amount,
    //   currency: 'usd',
    //   destination: user.sid,
    //   description: 'Payment transfer for withdraw.',
    // });
    // if (!transfer) {
    //   throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Payment transfer failed.");
    // }

    // if (transfer.balance_transaction) {
    //   withDraw.status = 'success';
    //   // cut the amount from user's wallet
    //   user.wallet -= withDraw.amount + withDraw.charge,
    //   Promise.all([
    //     withDraw.save(),
    //     // update the admin balance
    //     BalanceService.addChargeBalance(withDraw.charge),
    //     BalanceService.addAppBalance(-(withDraw.amount + withDraw.charge)),
    //     user.save(),
    //     // send notification to user
    //     NotificationService.addNotification({
    //       receiverId: withDraw.userId?.toString(),
    //       title: 'Withdraw success!',
    //       message: `Your withdrawal amount ${withDraw.amount} added to your account`
    //     }),
    //   ]);

    // }
    // return withDraw;
  }


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
