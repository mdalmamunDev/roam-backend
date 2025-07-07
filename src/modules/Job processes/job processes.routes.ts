import { Router } from 'express';
import auth from '../../middlewares/auth';
import { jobProcessController } from './job processes.controller';
import { Role } from '../user/user.constant';
import validateRequest from '../../shared/validateRequest';
import { validCreate, validFeedback, validServices, validUpdateStatus } from './job processes.validation';

const router = Router();
router.get('/:role', auth('common'), jobProcessController.getAll); // access all
router.get('/:role/:id', auth('common'), jobProcessController.getOne); // access single
router.put('/:role/:id', auth('common'), validateRequest(validUpdateStatus), jobProcessController.updateStatus); // update job process status / role = customer or provider
router.post('/provider/do-request', auth('provider'), validateRequest(validCreate), jobProcessController.create); // do request / create
router.post('/provider/add-services/:id', auth('mechanic' as Role), validateRequest(validServices), jobProcessController.providerAddServices); // add services & update status to 'serviced' for provider only
router.post('/customer/feedback/:id', auth('customer' as Role), validateRequest(validFeedback), jobProcessController.customerLeaveFeedback)

export const JobProcessRoutes = router;
