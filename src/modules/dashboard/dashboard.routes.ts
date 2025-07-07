import { Router } from 'express';
import auth from '../../middlewares/auth';
import DashboardController from './dashboard.controller';

const router = Router();
router.get('/', auth('admin'), DashboardController.getDashboard);
router.get('/earnings', auth('admin'), DashboardController.getEarnings);
router.get('/withdraw', auth('admin'), DashboardController.getWithdraw);
router.get('/transactions', auth('admin'), DashboardController.getTransactions);

export const DashboardRoutes = router;
