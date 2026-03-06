import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/apple', AuthController.appleLogin);

/**
 * POST /api/auth/register
 */
router.post('/register', AuthController.register);

/**
 * GET /api/auth/me
 * Get logged-in user (from token)
 */
router.get('/me', authMiddleware, AuthController.getMe);
router.get('/user/:id', authMiddleware, AuthController.getUserById);
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

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email with a secure token link.
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Validates the token and updates the user password.
 */
router.post('/reset-password', AuthController.resetPassword);

export default router;
