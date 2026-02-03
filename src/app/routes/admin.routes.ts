import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { upload } from '../../utils/multer';

const router = Router();
const controller = new AdminController();

router.post(
  '/users',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  controller.createUser
);

router.get('/users', authMiddleware, adminMiddleware, controller.getUsers);

router.get(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  controller.getUserById
);

router.put(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  controller.updateUser
);

router.delete(
  '/users/:id',
  authMiddleware,
  adminMiddleware,
  controller.deleteUser
);

export default router;
