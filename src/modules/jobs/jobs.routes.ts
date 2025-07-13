import { Router } from 'express';
import auth from '../../middlewares/auth';
import JobController  from './jobs.controller';
import validateRequest from '../../shared/validateRequest';
import { validBook, validCreate, validReview, validReviewUser } from './jobs.validation';

const router = Router();

router.get('/user/ongoing', auth(['user', 'provider']), JobController.getOnGoingForUser);
router.get('/user/history', auth(['user', 'provider']), JobController.getHistoryForUser);
router.get('/provider/ongoing', auth('provider'), JobController.getOnGoingForProvider);
router.get('/provider/history', auth('provider'), JobController.getHistoryForProvider);
router.get('/provider/requested', auth('provider'), JobController.getRequestedForProvider);
router.get('/user/history', auth(['user', 'provider']), JobController.getHistoryForUser);
router.post('/', auth(['user', 'provider']), validateRequest(validCreate), JobController.create);
router.get('/details/:jobId/:providerId', auth(['user', 'provider']), JobController.detailsPre);
router.post('/book/:id', auth(['user', 'provider']), validateRequest(validBook), JobController.book); // book a tow truck
router.post('/accept/:id', auth('provider'), JobController.acceptTrip); // book a tow truck
router.post('/cancel/:id', auth(['user', 'provider']), JobController.cancelTrip);
router.post('/decline/:id', auth('provider'), JobController.cancelTrip);
router.post('/review/:id', auth(['user', 'provider']), validateRequest(validReview), JobController.review); // book a tow truck
router.post('/review-user', auth('provider'), validateRequest(validReviewUser), JobController.reviewUser); // book a tow truck

export const JobRoutes = router;
