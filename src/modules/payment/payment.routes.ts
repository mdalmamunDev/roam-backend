import express from 'express';
import { PaymentController } from './payment.controllers';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { ValidPayment } from './payment.validation';
import createUploadMiddleware from '../../middlewares/upload';

const router = express.Router();

// router.post('/add-balance', auth(['customer', 'mechanic', 'tow_truck']), validateRequest(ValidPayment.addBalance), PaymentController.addBalance); // will provide a url for payment
// router.post("/withdraw/request", auth(['customer', 'mechanic', 'tow_truck']), validateRequest(ValidPayment.withdrawReq), PaymentController.sendWithdrawReq);
// router.post('/withdraw/:withDrawId', auth('admin'), validateRequest(ValidPayment.withdrawAdminRes), PaymentController.withdrawRes);
// router.get('/history', auth(['customer', 'mechanic', 'tow_truck']), PaymentController.userHistory);
// router.post(
//     "/refund/request",
//     auth('customer'),
//     createUploadMiddleware(200, ['.jpg', '.png']).array('files', 4),
//     validateRequest(ValidPayment.refundReq),
//     PaymentController.refundReq);
// router.post("/refund/response/:transactionId", auth('admin'), validateRequest(ValidPayment.refundAdminRes), PaymentController.refundAdminRes);
router.post('/transaction/send/:jobId', auth(['user', 'provider']), PaymentController.sendToProvider);
router.post('/transaction/transfer/:jobId', auth(['user', 'provider']), PaymentController.transferToProvider);
// router.get('/transaction/:id', auth('admin'), PaymentController.getTransactionById);
// router.get('/all', auth('admin'), PaymentController.getAll);
// router.get('/chart', auth('admin'), PaymentController.getEarningChart);

export const PaymentRoutes = router;
