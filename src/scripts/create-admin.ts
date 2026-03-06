import mongoose from 'mongoose';
import User from '../app/models/User.model';
import { env } from '../config/env';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'admin@doconcall.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists. Updating role and resetting password...');
            existingAdmin.role = 'admin';
            existingAdmin.password = 'admin123'; // The pre-save hook will hash this
            await existingAdmin.save();
            console.log('✅ Admin credentials verified.');
        } else {
            console.log('🚀 Creating new admin user...');
            // Let the model pre-save hook handle the hashing
            await User.create({
                email: adminEmail,
                password: 'admin123',
                firstName: 'System',
                lastName: 'Admin',
                role: 'admin',
                preferences: {
                    darkMode: true,
                    notifications: true,
                    newsletter: false
                }
            });
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n--- ADMIN CREDENTIALS ---');
        console.log(`Email: ${adminEmail}`);
        console.log('Password: admin123');
        console.log('-------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin:', error);
        process.exit(1);
    }
}

createAdmin();
