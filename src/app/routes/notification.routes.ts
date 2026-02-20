import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getUserNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getUserNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
