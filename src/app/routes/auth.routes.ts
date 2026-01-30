import { Router } from 'express';
import { AuthService } from '../services/auth.service';

const router = Router();
const authService = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);

    // ✅ SET COOKIE (SPRINT REQUIREMENT)
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

export default router;
