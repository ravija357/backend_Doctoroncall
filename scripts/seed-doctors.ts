
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/app/models/User.model';
import Doctor from '../src/app/models/Doctor.model';
import bcrypt from 'bcryptjs';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const doctorsToCreate = [
    {
        firstName: "Sarah", lastName: "Wilson", email: "sarah.wilson@example.com",
        specialization: "Cardiologist", experience: 12, fees: 150,
        bio: "Expert in heart health and cardiovascular surgery.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
        firstName: "James", lastName: "Chen", email: "james.chen@example.com",
        specialization: "Neurologist", experience: 15, fees: 200,
        bio: "Specialist in brain disorders and nervous system.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James"
    },
    {
        firstName: "Emily", lastName: "Rodriguez", email: "emily.r@example.com",
        specialization: "Dermatologist", experience: 8, fees: 120,
        bio: "Skin care specialist and cosmetic dermatology.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
    },
    {
        firstName: "Michael", lastName: "Chang", email: "michael.chang@example.com",
        specialization: "Pediatrician", experience: 10, fees: 100,
        bio: "Caring for children from infancy through adolescence.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
        firstName: "Lisa", lastName: "Thompson", email: "lisa.t@example.com",
        specialization: "Orthopedic", experience: 18, fees: 180,
        bio: "Bone and joint specialist, sports medicine expert.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa"
    },
    {
        firstName: "David", lastName: "Kim", email: "david.kim@example.com",
        specialization: "Dermatologist", experience: 6, fees: 110,
        bio: "Advanced clinical dermatology.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    },
    {
        firstName: "Anita", lastName: "Patel", email: "anita.patel@example.com",
        specialization: "Gynecologist", experience: 14, fees: 160,
        bio: "Women's health specialist.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita"
    },
    {
        firstName: "Robert", lastName: "Fox", email: "robert.fox@example.com",
        specialization: "Psychiatrist", experience: 20, fees: 220,
        bio: "Mental health and therapy expert.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"
    }
];

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('MongoDB Connected');

        for (const docData of doctorsToCreate) {
            // Check if user exists
            const existingUser = await User.findOne({ email: docData.email });
            if (existingUser) {
                console.log(`User ${docData.email} already exists, skipping...`);
                continue;
            }

            // Create User
            const hashedPassword = await bcrypt.hash("password123", 10);
            const user = await User.create({
                firstName: docData.firstName,
                lastName: docData.lastName,
                email: docData.email,
                password: hashedPassword,
                role: 'doctor',
                image: docData.image
            });

            // Create Doctor Profile
            await Doctor.create({
                user: user._id,
                specialization: docData.specialization,
                experience: docData.experience,
                qualifications: ["MBBS", "MD"],
                bio: docData.bio,
                fees: docData.fees,
                hospital: "City General Hospital",
                workingHours: { start: "09:00", end: "17:00" },
                schedules: [
                    { day: "Monday", startTime: "09:00", endTime: "17:00" },
                    { day: "Tuesday", startTime: "09:00", endTime: "17:00" },
                    { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
                    { day: "Thursday", startTime: "09:00", endTime: "17:00" },
                    { day: "Friday", startTime: "09:00", endTime: "17:00" },
                ]
            });

            console.log(`Created doctor: ${docData.firstName} ${docData.lastName}`);
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDoctors();
