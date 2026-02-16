import { Router } from 'express';
import * as AvailabilityController from '../controllers/availability.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, AvailabilityController.setAvailability);
router.get('/', AvailabilityController.getAvailability);

export default router;
