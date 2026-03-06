import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import User from '../models/User.model';
import { emitToUser } from '../socket/socket.controller';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    console.log(`[CONTROLLER DEBUG] Login Request: email="${email}", role="${role}", passLength=${password?.length}`);
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

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, role } = req.body;
    const result = await authService.googleLogin(idToken, role);

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
    const status = err.message.includes('Access denied') ? 403 : 400;
    return res.status(status).json({
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

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
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

export const appleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, role } = req.body;
    const result = await authService.appleLogin(idToken, role);

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
    const status = err.message.includes('Access denied') ? 403 : 400;
    return res.status(status).json({
      success: false,
      message: err.message,
    });
  }
};

/* ─── Forgot Password ─────────────────────────────────── */

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond with success to avoid user enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    // Generate secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    // Send email
    const { sendPasswordResetEmail } = await import('../services/email.service');
    await sendPasswordResetEmail(user.email, user.firstName, token);

    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err: any) {
    console.error('[forgotPassword] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};

/* ─── Reset Password ─────────────────────────────────── */

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Set new password — the pre-save hook will hash it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('[resetPassword] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};
