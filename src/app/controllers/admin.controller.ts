import { Request, Response } from 'express';
import User from '../models/User.model';
import Doctor from '../models/Doctor.model';
import bcrypt from 'bcryptjs';

export class AdminController {
  async createUser(req: Request, res: Response) {
    const { email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    res.status(201).json(user);
  }

  async getUsers(_req: Request, res: Response) {
    const users = await User.find().select('-password');
    res.json(users);
  }

  async getUserById(req: Request, res: Response) {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  }

  async updateUser(req: Request, res: Response) {
    const data: any = req.body;

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    }).select('-password');

    res.json(user);
  }

  async deleteUser(req: Request, res: Response) {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  }

  async verifyDoctor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Find doctor by user ID or doctor ID? Route params usually ID.
      // Let's assume ID is Doctor ID for specificity, or User ID.
      // Given it's admin/doctors/:id, let's allow passing Doctor ID.

      // const Doctor = require('../models/Doctor.model').default; // Dynamic import to avoid circular dependency if any? No, just standard import

      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }

      doctor.isVerified = true;
      await doctor.save();

      return res.json({ success: true, message: 'Doctor verified successfully', data: doctor });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}