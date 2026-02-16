import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../../utils/multer';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', AuthController.login);

/**
 * POST /api/auth/register
 */
router.post('/register', AuthController.register);

/**
 * GET /api/auth/me
 * Get logged-in user (from token)
 */
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/logout', AuthController.logout);

/**
 * PUT /api/auth/:id
 * Update logged-in user profile (with image)
 */
router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  AuthController.updateProfile
);

export default router;
