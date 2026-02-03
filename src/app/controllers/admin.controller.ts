import { Request, Response } from 'express';
import User from '../../models/User.model';
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
}