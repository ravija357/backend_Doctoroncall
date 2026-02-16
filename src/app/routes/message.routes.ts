import express from 'express';
import { authMiddleware as protect } from '../middlewares/auth.middleware';
import { getMessages, getContacts } from '../controllers/message.controller';

const router = express.Router();

router.get('/contacts', protect, getContacts);
router.get('/:id', protect, getMessages);

export default router;
