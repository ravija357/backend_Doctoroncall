import mongoose from 'mongoose';
import User from '../app/models/User.model';
import { AuthService } from '../app/services/auth.service';
import { env } from '../config/env';
import bcrypt from 'bcryptjs';

async function debugLogin() {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@doconcall.com';
        const password = 'admin123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found in database!');
            process.exit(1);
        }

        console.log('👤 User found:', {
            id: user._id,
            email: user.email,
            role: user.role,
            hasPassword: !!user.password
        });

        const isPasswordMatch = await user.comparePassword(password);
        console.log(`🔑 Password match (model.comparePassword): ${isPasswordMatch}`);

        const manualCheck = await bcrypt.compare(password, user.password!);
        console.log(`🔑 Password match (manual bcrypt.compare): ${manualCheck}`);

        const authService = new AuthService();
        try {
            const loginResult = await authService.login({ email, password, role: 'doctor' });
            console.log('✅ AuthService.login success!', loginResult.user);
        } catch (authError: any) {
            console.log('❌ AuthService.login failed:', authError.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Debug script failed:', error);
        process.exit(1);
    }
}

debugLogin();
