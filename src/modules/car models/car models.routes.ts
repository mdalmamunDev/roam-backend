import { Router } from 'express';
import auth from '../../middlewares/auth';
import { CarModelController } from './car models.controller';

const router = Router();
router.get('/', CarModelController.getAll); // access all
router.get('/admin', auth('admin'), CarModelController.getAllPaginated); // access all for admin
router.post('/', auth('admin'), CarModelController.create); // store new
router.put('/:id', auth('admin'), CarModelController.update); // update
router.delete('/:id', auth('admin'), CarModelController.drop); // delete

export const CarModelRoutes = router;
