import payment from "../../helpers/payment";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import ApiError from "../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "./payment.service";
import { User } from "../user/user.model";
import { NotificationService } from "../notification/notification.services";
import { BalanceService } from "../balance/balance.service";
import Transaction from "./transaction/transaction.model";
import { ITransactionStatus } from "./transaction/transaction.interface";
import Job from "../jobs/jobs.model";
import { IJobStatus } from "../jobs/jobs.interface";
import * as crypto from 'crypto';
import { config } from "../../config";


class Controller {
  // Handle Stripe webhook events
  handleWebhook = catchAsync(async (req: any, res: any) => {
    // Step 1: Log raw buffer (confirm it is not parsed)
    console.log('🔍 Raw body (buffer):', req.body);

    // Step 2: Generate HMAC hash of raw body
    const hash = crypto
      .createHmac('sha512', config.pay?.secretKey)
      .update(req.body)
      .digest('hex');

    // Step 3: Log generated hash and incoming header
    const paystackSignature = req.headers['x-paystack-signature'];
    console.log('🔐 Generated hash:', hash);
    console.log('📩 Header signature:', paystackSignature);

    // Step 4: Validate signature
    if (hash !== paystackSignature) {
      console.log('❌ Signature mismatch');
      return res.status(401).send('Invalid signature');
    }

    // Step 5: Convert raw buffer to JSON
    const event = JSON.parse(req.body.toString());
    console.log('✅ Parsed event:', event);

    // Step 6: Handle different event types
    switch (event.event) {
      case 'charge.success':
        console.log('💰 charge.success event triggered');
        const { reference, amount, metadata } = event.data;
        console.log('📦 Reference:', reference);
        console.log('💵 Amount:', amount);
        console.log('📄 Metadata:', metadata);
        // TODO: Lookup transaction in DB and update wallet here
        break;

      case 'transfer.success':
        console.log('✅ Transfer success:', event.data.reference);
        break;

      case 'transfer.failed':
        console.log('❌ Transfer failed:', event.data.reference);
        break;

      default:
        console.log('ℹ️ Unhandled event:', event.event);
    }

    return res.status(200).send('Webhook received');
    // const sig = req.headers['payment-signature'] as string;

    // let event;

    // event = payment.webhooks.constructEvent(req.body, sig, process.env.PAYSTACK_WEBHOOK_SECRET!);

    // console.log('Webhook received:', event);

    // // Handle the event
    // const session: any = event.data?.object;
    // if (!session || !session.id) {
    //   return sendResponse(res, { code: StatusCodes.BAD_REQUEST, message: "Invalid session object received." });
    // }
    // switch (event.type) {
    //   case 'checkout.session.completed': {
    //     const payment = await PaymentService.update({ sessionId: session.id }, { status: 'success', trId: session.payment_intent });
    //     if (payment) {
    //       await Promise.all([
    //         User.findByIdAndUpdate(payment.userId, { $inc: { wallet: payment.amount } }),
    //         NotificationService.addNotification({ receiverId: payment.userId.toString(), title: 'Add balance', message: `You have added ${payment.amount}$ successfully.` }),
    //         BalanceService.addAppBalance(payment.amount),
    //       ]);
    //     }
    //     break;
    //   }
    //   case 'checkout.session.async_payment_failed': {
    //     const payment = await PaymentService.update({ sessionId: session.id }, { status: 'failed' });
    //     if (payment) {
    //       await NotificationService.addNotification({ receiverId: payment.userId.toString(), title: 'Add balance', message: `Your payment ${payment.amount}$ was incomplete.` })
    //     }
    //     break;
    //   }
    //   default:
    //     console.log(`Unhandled event type ${event.type}`);
    // }

    // sendResponse(res, { code: StatusCodes.OK, message: "Webhook received", data: { received: true } });
  });



  addBalance = catchAsync(async (req, res) => {
    const { amount } = req.body
    const user = req.user;
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User Not Found ! ");
    

    const success_url = `${req.protocol}://${req.get('host')}/payment-success`
    // const cancel_url = `${req.protocol}://${req.get('host')}/payment-cancel`
    const result = await PaymentService.createCheckoutSession(
      user.email, amount, success_url,
      {
        userId: user._id, 
        purpose: 'Wallet Deposit'
      }
    );

    // store the payment details
    // await PaymentService.store(user.userId, sessionId);

    sendResponse(res, { code: StatusCodes.OK, message: " Please add your balance ", data: result });
  });

  // user send to admin to withdraw their mony
  sendWithdrawReq = catchAsync(async (req, res) => {
    const { amount } = req.body;
    
    const refresh_url = `${req.protocol}://${req.get('host')}/payment-cancel`
    const return_url = `${req.protocol}://${req.get('host')}/payment-success`
    const data: any = await PaymentService.withdrawReq(amount, req.user?.userId, refresh_url, return_url)
    sendResponse(res, { code: StatusCodes.OK, message: data.url ? 'Please setup your account first.' : 'Withdraw request sent ! ', data });
  })

  // admin response the request
  withdrawRes = catchAsync(async (req, res) => {
    const { withDrawId } = req.params
    const { status } = req.body;
    await PaymentService.withdrawAdminRes(withDrawId, status)
    sendResponse(res, { code: StatusCodes.OK, message: `Withdraw successfully ${status} !` });
  })



  userHistory = catchAsync(async (req, res) => {

    const data = await PaymentService.userHistory(req.user.userId);

    // Send the response with the results and pagination info
    sendResponse(res, { code: StatusCodes.OK, message: 'Payments retrieved successfully', data });
  });

  getAll = catchAsync(async (req, res) => {

    const { results, pagination } = await PaymentService.getAll(req);

    // Send the response with the results and pagination info
    sendResponse(res, { code: StatusCodes.OK, message: 'Payments retrieved successfully', data: results, pagination });
  });
  getEarningChart = catchAsync(async (req, res) => {
    const { month, year } = req.query;

    // Validate month and year
    const parsedMonth = parseInt(month as string, 10);
    const parsedYear = parseInt(year as string, 10);

    const data = await PaymentService.getEarningsDataForMonth(parsedMonth, parsedYear);
    sendResponse(res, { code: StatusCodes.OK, message: `Earning chart for ${year}-${month}.`, data });
  });

  getTransactionById = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Transaction id isn\'t valid')
    }
    const transaction = await Transaction.findById(id).populate('customerId', 'name email');
    if (!transaction) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
    }
    sendResponse(res, { code: StatusCodes.OK, message: 'Transaction retrieved successfully', data: transaction });
  });

  refundReq = catchAsync(async (req, res) => {

    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You don\'t have permission to access this api.')
    }

    // get & update transaction
    const { jobProcessId, type, refundDetails } = req.body
    const refundImages: string[] = [];

    const uploadedFiles = req.files as Express.Multer.File[]; // ensure typing

    if (uploadedFiles && uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        refundImages.push(file.filename); // collect uploaded filenames
      });
    }

    const transaction = await Transaction.findOneAndUpdate({ jobProcessId, type, customerId: req.user?.userId }, { refundImages, refundDetails, isRefundRequested: true }, { new: true });
    if (!transaction) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found.');
    }


    sendResponse(res, { code: StatusCodes.OK, message: "Request stored successfully." });
  });

  refundAdminRes = catchAsync(async (req, res) => {
    const { transactionId } = req.params;
    if (!transactionId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Transaction id isn\'t valid')
    }

    const { refunded } = req.body;
    const transaction = await Transaction.findOne({ _id: transactionId, isRefundRequested: true, status: 'created' });
    if (!transaction) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found or it\'s not requested yet.');
    }

    const customer = await User.findById(transaction.userId);
    if (!customer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
    }

    if (refunded) {
      // process the refund and transfer the amount back to the customer
      transaction.status = 'refunded';
      transaction.isRefundRequested = false;

      customer.wallet += transaction.amount;
      await Promise.all([
        customer.save(),
        transaction.save(),
        // notify customer
        NotificationService.addNotification({
          receiverId: customer._id,
          title: 'Transaction refund!',
          message: 'Your refund request accepted.'
        }),
        // notify provider
        NotificationService.addNotification({
          receiverId: transaction.providerId,
          title: 'Transaction refund!',
          message: `${customer.name}'s refund request accepted.`
        })
      ]);
    } else {
      // cancel the refund request and transfer the amount back to the provider
      transaction.status = 'received';
      transaction.isRefundRequested = false;
      const provider = await User.findById(transaction.providerId);
      if (provider) {
        provider.wallet += transaction.amount;
        await provider.save();
      }
      await Promise.all([
        transaction.save(),
        // notify customer
        NotificationService.addNotification({
          receiverId: customer._id,
          title: 'Transaction refund!',
          message: 'Your refund request rejected.'
        }),
      ]);
    }
    sendResponse(res, { code: StatusCodes.OK, message: "Refund has been successfully processed." });
  });

  sendToProvider = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const transaction = await Transaction.findOneAndUpdate({jobId, status: 'created' as ITransactionStatus, userId: req.user?.userId}, {status: 'sent' as ITransactionStatus});
    if (!transaction) throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found or it\'s not possible yet.');

    // cut the amount from user wallet
    await Promise.all([
      User.findByIdAndUpdate(transaction.userId, { $inc: { wallet: -transaction.finalAmount } }),
      Job.findByIdAndUpdate(transaction.jobId, {status: 'paid' as IJobStatus}),
      BalanceService.addChargeBalance(transaction.charge - transaction.discount)
    ]);

    sendResponse(res, { code: StatusCodes.OK, message: "Send to provider successful." });
  });

  transferToProvider = catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const transaction = await Transaction.findOne({ jobId, status: 'sent' as ITransactionStatus, isRefundRequested: false, userId: req.user?.userId });
    if (!transaction) throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found or it\'s not possible yet.');

    // Transfer the amount to the provider's wallet
    const provider = await User.findById(transaction.providerId);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, 'Provider not found');
    

    provider.wallet += transaction.amount;
    transaction.status = 'received';
    await Promise.all([
      provider.save(),
      transaction.save(),
      Job.findByIdAndUpdate(transaction.jobId, {status: 'completed' as IJobStatus}),
    ]);

    sendResponse(res, { code: StatusCodes.OK, message: "Transfer to provider successful." });

    // make notification
    await NotificationService.addNotification({receiverId: transaction.providerId, title: "Mony received", message: `Your have received ${transaction.amount}`})
  });

  retSuccessRes = catchAsync(async (req, res) => {
    sendResponse(res, { code: StatusCodes.OK, message: "Payment successful." });
  });
  retCancelRes = catchAsync(async (req, res) => {
    sendResponse(res, { code: StatusCodes.GATEWAY_TIMEOUT, message: "Payment canceled." });
  });

}

export const PaymentController = new Controller();