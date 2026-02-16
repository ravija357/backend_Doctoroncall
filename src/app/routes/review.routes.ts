import { Router } from 'express';
import * as ReviewController from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, ReviewController.createReview);
router.get('/:doctorId', ReviewController.getDoctorReviews);

export default router;
