import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ServiceController } from './services.controller';

const router = Router();
router.get('/', ServiceController.getAll); // access all
router.get('/admin', auth('admin'), ServiceController.getAllPaginated); // access all for admin
router.post('/', auth('admin'), ServiceController.create); // store new
router.put('/:id', auth('admin'), ServiceController.update); // update
router.delete('/:id', auth('admin'), ServiceController.drop); // delete

export const ServiceRoutes = router;
