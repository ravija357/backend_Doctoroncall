import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../../utils/multer';
import User from '../../models/User.model';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
    });

    return res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
    });

    return res.status(201).json({
      success: true,
      data: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get logged-in user (from token)
 */
router.get('/me', authMiddleware, async (req: any, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
});

/**
 * PUT /api/auth/:id
 * Update logged-in user profile (with image)
 */
router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    const data: any = req.body;

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    }).select('-password');

    return res.json({
      success: true,
      data: user,
    });
  }
);

export default router;
