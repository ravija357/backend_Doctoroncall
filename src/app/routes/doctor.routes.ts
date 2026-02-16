import { Router } from 'express';
import * as DoctorController from '../controllers/doctor.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', DoctorController.getAllDoctors);
router.get('/:id', DoctorController.getDoctorById);

// Protected routes
router.post('/profile', authMiddleware, DoctorController.createProfile);
router.get('/profile/me', authMiddleware, DoctorController.getProfile);
router.put('/profile/schedule', authMiddleware, DoctorController.updateSchedule);

export default router;
