import { Router } from 'express';
import { ExperienceController } from './experiences.controller';
import auth from '../../middlewares/auth';

const router = Router();
router.get('/', ExperienceController.getAll); // access all
router.get('/admin', auth('admin'), ExperienceController.getAllPaginated); // access all for admin
router.post('/', auth('admin'), ExperienceController.create); // store new
router.put('/:id', auth('admin'), ExperienceController.update); // update
router.delete('/:id', auth('admin'), ExperienceController.drop); // delete

export const ExperienceRoutes = router;
