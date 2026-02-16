import { Router } from 'express';
import * as AppointmentController from '../controllers/appointment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, AppointmentController.createAppointment);
router.get('/my-appointments', authMiddleware, AppointmentController.getMyAppointments);
router.get('/doctor-appointments', authMiddleware, AppointmentController.getDoctorAppointments);
router.delete('/:id', authMiddleware, AppointmentController.deleteAppointment);
router.patch('/:id/cancel', authMiddleware, AppointmentController.cancelAppointment);

export default router;
