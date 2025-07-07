import { Router } from 'express';
import auth from '../../middlewares/auth';
import { jobController } from './jobs.controller';
import validateRequest from '../../shared/validateRequest';
import { validCreate, validCreateTT, validUpdate } from './jobs.validation';

const router = Router();
router.get('/', auth('customer'), jobController.getAllForCustomer); // access all for 
router.get('/admin', auth('admin'), jobController.getAllAToZ); // access all jobs A-Z
router.get('/provider/:radius', auth('provider'), jobController.getAllProvider); // access all jobs for tow truck
router.get('/:id', auth('common'), jobController.getById); // access single
router.post('/', auth('customer'), validateRequest(validCreate), jobController.create); // post a job
router.post('/tow_truck', auth('customer'), validateRequest(validCreateTT), jobController.create); // post a job
router.put('/:id', auth('customer'), validateRequest(validUpdate), jobController.update); // update
router.delete('/:id', auth('customer'), jobController.trash); // delete

export const JobRoutes = router;
