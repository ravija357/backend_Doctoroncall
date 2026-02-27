import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import User from '../models/User.model';
import { emitToUser } from '../socket/socket.controller';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    const result = await authService.login({ email, password, role });

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getMe = async (req: Request | any, res: Response) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const data: any = req.body;

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    if (data.preferences && typeof data.preferences === 'string') {
      try {
        data.preferences = JSON.parse(data.preferences);
      } catch (err) {
        console.error('Failed to parse preferences:', err);
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    }).select('-password');

    try {
      const notificationService = new NotificationService();
      await notificationService.createNotification({
        recipient: req.params.id,
        message: 'Profile updated successfully',
        type: 'SUCCESS',
        link: '/profile'
      });
    } catch (e) {
      console.warn('Could not send profile update notification', e);
    }

    emitToUser(req.params.id, 'profile_sync', user);

    return res.json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
