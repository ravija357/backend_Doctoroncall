import { Router } from 'express';
import * as HistoryController from '../controllers/medical-history.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, HistoryController.createRecord);
router.get('/me', authMiddleware, HistoryController.getMyHistory);
router.get('/doctor', authMiddleware, HistoryController.getDoctorRecords);

export default router;
