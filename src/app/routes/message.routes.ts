import express from 'express';
import { authMiddleware as protect } from '../middlewares/auth.middleware';
import { getMessages, getContacts, getUnreadCount, markAsRead, uploadFile } from '../controllers/message.controller';
import { upload } from '../middlewares/upload.middleware';

const router = express.Router();

router.get('/contacts', protect, getContacts);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read/:senderId', protect, markAsRead);
router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/:id', protect, getMessages);

export default router;
