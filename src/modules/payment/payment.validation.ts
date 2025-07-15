import { z } from 'zod';
import { PaymentStatus } from './payment.interface';
import { WithdrawStatus } from './withdraw/withdraw.interface';

// Validation for the payment object

// const customerId = objectId;

// const providerId = objectId;

// const jobId = objectId;

// const type = z.enum(PaymentType as [string, ...string[]], {
//   errorMap: () => ({ message: `Payment type must be one of [${PaymentType.join(', ')}].` }),
// });

const amount = z.number().positive('Amount must be a positive number.');

// const commissionRate = z.number().positive('Commission rate must be a non-negative number.');

// const isRefundRequested = z.boolean().optional(); // Default to false

const status = z.enum(PaymentStatus as [string, ...string[]], {
  errorMap: () => ({ message: `Payment status must be one of [${PaymentStatus.join(', ')}].` }),
}).optional();

const PaymentValidation = {
  amount,
  status,
};
export default PaymentValidation;




class Valid {
  // Reusable validation for mechanicId
  withdrawReq = z.object({
    body: z.object({
      account_number: z.string(),
      bank_code: z.string(),
      amount: z.number().positive('Amount must be greater than 0'),
      reason: z.string().optional(),
    }).strict()
  });
  withdrawAdminRes = z.object({
    body: z.object({
      status: z.enum(WithdrawStatus as [string, ...string[]])
    }).strict()
  });
  addBalance = z.object({
    body: z.object({
      amount
    }).strict()
  });
  refundReq = z.object({
    body: z.object({
      // jobProcessId: z.string(), // TODO: valid object ID
      // type: z.enum(TransactionType as [string]),
      // // refundImages: z.array(z.string()),
      refundDetails: z.string(),
    })
  });
  refundAdminRes = z.object({
    body: z.object({
      refunded: z.boolean(),
    }).strict()
  });
}

export const ValidPayment = new Valid();
