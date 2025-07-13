import { Router } from 'express';
import auth from '../../middlewares/auth';
import { jobController } from './jobs.controller';
import validateRequest from '../../shared/validateRequest';
import { validBook, validCreate, validReview } from './jobs.validation';

const router = Router();

router.get('/user/ongoing', auth(['user', 'provider']), jobController.getOnGoingForUser); // post a job
router.get('/user/history', auth(['user', 'provider']), jobController.getHistoryForUser); // post a job
router.post('/', auth(['user', 'provider']), validateRequest(validCreate), jobController.create); // post a job
router.get('/details/:jobId/:providerId', auth(['user', 'provider']), jobController.detailsPre);
router.post('/book/:id', auth(['user', 'provider']), validateRequest(validBook), jobController.book); // book a tow truck
router.post('/accept/:id', auth('provider'), jobController.acceptTrip); // book a tow truck
router.post('/cancel/:id', auth(['user', 'provider']), jobController.cancelTrip); // book a tow truck
router.post('/review/:id', auth(['user', 'provider']), validateRequest(validReview), jobController.review); // book a tow truck

export const JobRoutes = router;
