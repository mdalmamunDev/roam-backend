import { Router } from 'express';
import { BalanceController } from './balance.controller';

const router = Router();
router.get('/', BalanceController.get);

export const BalanceRoutes = router;
