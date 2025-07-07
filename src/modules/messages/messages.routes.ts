import { Router } from 'express';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';

const router = Router();

router.get('/:receiverId', auth('common'), MessageController.getAll);
router.get('/thread/all', auth('common'), MessageController.getAllThreads);
// router.post('/thread/read/:threadId', auth('common'), MessageController.markThreadAsRead);
router.get('/thread/search', auth('common'), MessageController.searchThreads);

export const MessageRoutes = router;
