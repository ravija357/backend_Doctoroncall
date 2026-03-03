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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        image: user.image || null,
      },
      token
    };
  }

  async login(data: LoginDto) {
    const user = await this.repo.findByEmail(data.email);

    if (!user || !(await user.comparePassword(data.password))) {
      throw new Error('Invalid email or password');
    }

    if (data.role && user.role !== data.role) {
      throw new Error('Access denied. Invalid role for this portal.');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        image: user.image || null,
      },
      token
    };
  }

  async googleLogin(idToken: string) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google Token');
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    let user = await this.repo.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email
      user = await this.repo.findByEmail(email);

      if (user) {
        // Link google account
        user.googleId = googleId;
        if (!user.image) user.image = picture;
        await user.save();
      } else {
        // Create new user (default to patient if not specified, 
        // though usually we'd want the frontend to tell us or have a choice)
        user = await this.repo.create({
          email,
          googleId,
          firstName: given_name || 'User',
          lastName: family_name || '',
          image: picture,
          role: 'patient', // Default role for new social logins
          preferences: {
            darkMode: false,
            notifications: true,
            newsletter: false
          }
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        image: user.image || null,
      },
      token
    };
  }
}
