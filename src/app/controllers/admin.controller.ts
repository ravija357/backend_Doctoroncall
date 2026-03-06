import { Request, Response } from 'express';
import User from '../models/User.model';
import Doctor from '../models/Doctor.model';
import Appointment from '../models/Appointment.model';
import bcrypt from 'bcryptjs';

export class AdminController {
  async createUser(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        role,
        image: req.file ? `/uploads/${req.file.filename}` : null,
      });

      try {
        const { getIO } = require('../socket/socket.controller');
        const io = getIO();
        io.emit('admin_stats_sync');
        io.emit('admin_user_sync');
      } catch (err) {
        console.error('Socket emission failed:', err);
      }

      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUsers(_req: Request, res: Response) {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const data: any = req.body;

      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const user = await User.findByIdAndUpdate(req.params.id, data, {
        new: true,
      }).select('-password');

      if (user) {
        try {
          const { getIO } = require('../socket/socket.controller');
          const io = getIO();
          io.emit('admin_user_sync');
        } catch (err) {
          console.error('Socket emission failed:', err);
        }
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      await User.findByIdAndDelete(req.params.id);
      try {
        const { getIO } = require('../socket/socket.controller');
        const io = getIO();
        io.emit('admin_user_sync');
        io.emit('admin_stats_sync');
      } catch (err) {
        console.error('Socket emission failed:', err);
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyDoctor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }

      doctor.isVerified = true;
      await doctor.save();

      try {
        const { getIO, emitToUser } = require('../socket/socket.controller');
        const io = getIO();
        io.emit('admin_stats_sync');
        const userId = doctor.user.toString();
        emitToUser(userId, 'profile_sync', { id: doctor._id, isVerified: true });
      } catch (err) {
        console.error('Socket emission failed:', err);
      }

      return res.json({ success: true, message: 'Doctor verified successfully', data: doctor });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDashboardStats(_req: Request, res: Response) {
    try {
      const [totalUsers, activeDoctors, recentBookings] = await Promise.all([
        User.countDocuments(),
        Doctor.countDocuments({ isVerified: true }),
        Appointment.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          activeDoctors,
          recentBookings,
          systemStatus: "Optimal"
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}