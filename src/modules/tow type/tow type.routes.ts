import { Router } from 'express';
import auth from '../../middlewares/auth';
import TowTypeController from './tow type.controller';

const router = Router();
router.post('/', auth('admin'), TowTypeController.create);
router.get('/provider', TowTypeController.getAllProvider);
router.get('/', auth('admin'), TowTypeController.getAll);
router.put('/:id', auth('admin'), TowTypeController.update);
router.delete('/:id', auth('admin'), TowTypeController.delete);

export const TowTypesRoutes = router;
