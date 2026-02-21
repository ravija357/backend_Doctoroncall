import mongoose from 'mongoose';
import Appointment from '../app/models/Appointment.model';
import User from '../app/models/User.model';
import Doctor from '../app/models/Doctor.model';
import { env } from '../config/env';

async function seed() {
    const email = process.argv[2] || 'sarah.wilson@example.com';

    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find doctor by user email
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`❌ User with email ${email} not found`);
            process.exit(1);
        }

        const doctor = await Doctor.findOne({ user: user._id });
        if (!doctor) {
            console.error(`❌ Doctor profile for ${email} not found`);
            process.exit(1);
        }

        // Target Patient Ravi Jaiswal
        const patient = await User.findOne({ email: 'admin@gmail.com' });
        if (!patient) {
            console.error('❌ Patient Ravi Jaiswal (admin@gmail.com) not found');
            process.exit(1);
        }

        // Create a date that represents "Today 00:00" in LOCAL time
        // This will be stored as the previous day evening in UTC if in +05:45
        const todayLocal = new Date();
        todayLocal.setHours(0, 0, 0, 0);

        const appointments = [
            {
                patient: patient._id,
                doctor: doctor._id,
                date: todayLocal,
                startTime: '10:00',
                endTime: '10:30',
                status: 'confirmed',
                reason: 'Follow-up Consultation'
            },
            {
                patient: patient._id,
                doctor: doctor._id,
                date: todayLocal,
                startTime: '15:45',
                endTime: '16:15',
                status: 'pending',
                reason: 'Initial checkup'
            }
        ];

        // Clear existing for today
        await Appointment.deleteMany({
            doctor: doctor._id,
            date: todayLocal
        });

        const created = await Appointment.insertMany(appointments);
        console.log(`✅ Successfully seeded ${created.length} appointments for ${email} on date: ${todayLocal.toISOString()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
