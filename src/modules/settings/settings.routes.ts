import { Router } from 'express';
import auth from '../../middlewares/auth';
import { SettingController } from './settings.controller';

const router = Router();
router.get('/generals', SettingController.getSettingGenerals);
router.post('/generals', SettingController.updateGenerals);

router.get('/:key', SettingController.getSetting);
router.post('/:key', auth('admin'), SettingController.createOrUpdate);

export const SettingsRoutes = router;
