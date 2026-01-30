import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import type { RegisterDto } from '../../dto/register.dto';
import type { LoginDto } from '../../dto/login.dto';

export class AuthService {
  private repo = new AuthRepository();

  async register(data: RegisterDto) {
    const existingUser = await this.repo.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = await this.repo.create(data);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async login(data: LoginDto) {
    const user = await this.repo.findByEmail(data.email);

    if (!user || !(await user.comparePassword(data.password))) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      token
    };
  }
}
