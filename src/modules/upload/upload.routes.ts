import express from 'express';
import upload from '../../middlewares/upload';
import { uploadFile, uploadMultipleFiles } from './upload.controller';
import createUploadMiddleware from '../../middlewares/upload';

const router = express.Router();

// Handle file upload
router.post('/', createUploadMiddleware().single('file'), uploadFile);
router.post('/multiple', createUploadMiddleware(20, ['.jpg', '.jpeg', '.png', '.pdf']).array('files', 10), uploadMultipleFiles);

export const UploadRoutes = router;
