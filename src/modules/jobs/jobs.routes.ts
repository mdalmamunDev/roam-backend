import { Router } from 'express';
import auth from '../../middlewares/auth';
import { jobController } from './jobs.controller';
import validateRequest from '../../shared/validateRequest';
import { validBook, validCreate } from './jobs.validation';

const router = Router();

router.post('/', auth(['user', 'provider']), validateRequest(validCreate), jobController.create); // post a job
router.post('/book', auth(['user', 'provider']), validateRequest(validBook), jobController.book); // book a tow truck
router.post('/accept/:id', auth('provider'), jobController.acceptTrip); // book a tow truck
router.post('/cancel/:id', auth(['user', 'provider']), jobController.cancelTrip); // book a tow truck

export const JobRoutes = router;
