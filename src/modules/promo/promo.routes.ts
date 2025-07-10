import { Router } from 'express';
import auth from '../../middlewares/auth';
import PromoController from './promo.controller';

const router = Router();
router.post('/', auth('admin'), PromoController.create);
router.get('/', auth('admin'), PromoController.getAll);
router.get('/:id', auth('admin'), PromoController.getSingle);
router.put('/:id', auth('admin'), PromoController.update);
router.delete('/:id', auth('admin'), PromoController.delete);

export const PromoRoutes = router;
