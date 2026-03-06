import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import type { RegisterDto } from '../../dto/register.dto';
import type { LoginDto } from '../../dto/login.dto';

export class AuthService {
  private repo = new AuthRepository();

  private formatUserResponse(user: any) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      image: user.image || null,
      phone: user.phone || '',
      bio: user.bio || '',
      address: user.address || '',
      preferences: user.preferences
    };
  }

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
      user: this.formatUserResponse(user),
      token
    };
  }

  async login(data: LoginDto) {
    const sanitizedEmail = data.email.trim().toLowerCase();
    console.log(`[AUTH DEBUG] Attempting login for: "${sanitizedEmail}" with role: "${data.role}"`);

    const user = await this.repo.findByEmail(sanitizedEmail);

    if (!user) {
      console.log(`[AUTH DEBUG] User not found: "${sanitizedEmail}"`);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(data.password);
    console.log(`[AUTH DEBUG] Password match for "${sanitizedEmail}": ${isMatch}`);

    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (data.role && user.role !== data.role && user.role !== 'admin') {
      console.log(`[AUTH DEBUG] Role mismatch. User: ${user.role}, Portal: ${data.role}`);
      throw new Error('Access denied. Invalid role for this portal.');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: this.formatUserResponse(user),
      token
    };
  }

  async googleLogin(idToken: string, role?: string) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload: any;

    try {
      // Try verifying as an ID Token first
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (error) {
      // If it's not a valid ID Token, it might be an Access Token
      // Use it to fetch user info directly from Google
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
        if (!response.ok) throw new Error('Failed to fetch user info from Google');
        payload = await response.json();
        // The API returns 'sub' instead of 'googleId' in some flows, but usually standard OIDC fields
      } catch (innerError) {
        console.error('Google verification failed:', error, innerError);
        throw new Error('Invalid Google Token');
      }
    }

    if (!payload || !payload.email) {
      throw new Error('Invalid Google Token payload');
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
        // Create new user (default to patient if not specified)
        user = await this.repo.create({
          email,
          googleId,
          firstName: given_name || 'User',
          lastName: family_name || '',
          image: picture,
          role: role || 'patient', // Default role if not specified
          preferences: {
            darkMode: false,
            notifications: true,
            newsletter: false
          }
        });
      }
    }

    // Role Validation: Ensure the user's role matches the portal they are logging into
    if (role && user.role !== role) {
      throw new Error(`Access denied. Invalid role for this portal.`);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: this.formatUserResponse(user),
      token
    };
  }

  async appleLogin(idToken: string, role?: string) {
    // NOTE: In a real production app, you would verify the Apple idToken using a library like 'apple-signin-auth'
    // For this implementation, we will perform a mock verification based on the token.
    // The idToken should ideally be a JWT that contains user info on first sign-in.

    // For demonstration, we'll simulate decoding a token to get an email.
    // In reality, this would be: const { sub: appleId, email } = await verifyAppleToken(idToken);

    // Mocking the result for now to allow flow testing
    const appleId = `apple_${idToken.substring(0, 10)}`;
    const email = `apple_user_${idToken.substring(0, 5)}@example.com`; // Mock email if not provided by token

    let user = await this.repo.findByAppleId(appleId);

    if (!user) {
      user = await this.repo.findByEmail(email);

      if (user) {
        user.appleId = appleId;
        await user.save();
      } else {
        user = await this.repo.create({
          email,
          appleId,
          firstName: 'Apple',
          lastName: 'User',
          role: role || 'patient',
          preferences: {
            darkMode: false,
            notifications: true,
            newsletter: false
          }
        });
      }
    }

    // Role Validation: Ensure the user's role matches the portal they are logging into
    if (role && user.role !== role) {
      throw new Error(`Access denied. Invalid role for this portal.`);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      user: this.formatUserResponse(user),
      token
    };
  }
}
