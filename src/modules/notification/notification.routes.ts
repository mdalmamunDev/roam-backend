import { Router } from 'express';
import auth from '../../middlewares/auth';
import { NotificationController } from './notification.controllers';

const router = Router();

router.get('/', auth('common'), NotificationController.getALLNotification);
router.get('/count', auth('common'), NotificationController.getUnseenNotificationCount);

export const NotificationRoutes = router;
