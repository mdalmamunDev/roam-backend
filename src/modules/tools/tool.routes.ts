import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ToolController } from './tool.controller';

const router = Router();
router.get('/', ToolController.getAll); // access all
router.get('/admin', auth('admin'), ToolController.getAllPaginated); // access all for admin
router.post('/', auth('admin'), ToolController.create); // store new
router.put('/:id', auth('admin'), ToolController.update); // update
router.delete('/:id', auth('admin'), ToolController.drop); // delete

export const ToolRoutes = router;
