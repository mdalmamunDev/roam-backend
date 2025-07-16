import { Router } from 'express';
import auth from '../../middlewares/auth';
import ReportController from './report.controller';
import { ValidReport } from './report.validation';
import validateRequest from '../../shared/validateRequest';

const router = Router();
router.post('/', validateRequest(ValidReport.create), auth(['user', 'provider']), ReportController.create);
router.get('/', auth('admin'), ReportController.getAll);
router.get('/:id', auth('admin'), ReportController.getSingle);
router.put('/:id', validateRequest(ValidReport.action), auth('admin'), ReportController.update);
router.delete('/:id', auth('admin'), ReportController.delete);

export const ReportRoutes = router;
