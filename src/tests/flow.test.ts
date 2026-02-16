import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Import App Routes
import authRoutes from '../app/routes/auth.routes';
import doctorRoutes from '../app/routes/doctor.routes';
import availabilityRoutes from '../app/routes/availability.routes';
import appointmentRoutes from '../app/routes/appointment.routes';

// Mock Auth Middleware to simple pass-through or mock user
// Since we are testing full flow, we might want to actually use the real auth middleware
// BUT for integration tests without a running real DB, MongoMemoryServer is best.
// And we need to mock the `env` config to not crash on missing .env vars if running in isolation,
// OR we just ensure process.env is set.

// Setup App
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

// Test Variables
let mongoServer: MongoMemoryServer;
let patientToken: string;
let doctorToken: string;
let doctorUserId: string;
let patientUserId: string;
let doctorProfileId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret'; // Ensure secret is set
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Doctor Booking System Integration Flow', () => {

    // 1. Auth & Registration
    it('should register a new patient', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'patient@example.com',
                password: 'password123',
                role: 'user' // Default
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.header['set-cookie']).toBeDefined();
        // Extract token roughly or just rely on cookie if supertest agent is used.
        // For simplicity, we'll login to get clean token if needed, or if the response returns it (it does usually in real auth service).
        // Our controller sets cookie.
    });

    it('should register a new doctor user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'doctor@example.com',
                password: 'password123',
                role: 'doctor' // Assuming role field exists in model but our DTO might not enforce it yet, let's check User model
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('should login as doctor and get token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'doctor@example.com',
                password: 'password123'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        doctorUserId = res.body.user.id;

        // Extract token from cookie
        const cookies = res.header['set-cookie'];
        expect(cookies).toBeDefined();
        doctorToken = cookies[0].split(';')[0].split('=')[1];
    });

    it('should login as patient and get token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'patient@example.com',
                password: 'password123'
            });

        expect(res.status).toBe(200);
        patientUserId = res.body.user.id;

        const cookies = res.header['set-cookie'];
        patientToken = cookies[0].split(';')[0].split('=')[1];
    });

    // 2. Doctor Profile
    it('should create a doctor profile', async () => {
        const res = await request(app)
            .post('/api/doctors/profile')
            .set('Cookie', `token=${doctorToken}`)
            .send({
                specialization: 'Cardiology',
                experience: 10,
                qualifications: ['MBBS', 'MD'],
                bio: 'Expert heart specialist with 10 years of experience.',
                fees: 500,
                workingHours: {
                    start: '09:00',
                    end: '17:00'
                }
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        doctorProfileId = res.body.data._id;
    });

    it('should get doctor profile', async () => {
        const res = await request(app)
            .get('/api/doctors/profile/me')
            .set('Cookie', `token=${doctorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.specialization).toBe('Cardiology');
    });

    // 3. Availability
    it('should set availability for the doctor', async () => {
        const res = await request(app)
            .post('/api/availability')
            .set('Cookie', `token=${doctorToken}`)
            .send({
                date: '2023-12-25',
                slots: [
                    { startTime: '10:00', endTime: '10:30' },
                    { startTime: '10:30', endTime: '11:00' }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.data.slots).toHaveLength(2);
    });

    it('should search availability as a patient', async () => {
        const res = await request(app)
            .get(`/api/availability?doctorId=${doctorProfileId}&date=2023-12-25`)
            .set('Cookie', `token=${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.slots).toHaveLength(2);
        expect(res.body.data.slots[0].isBooked).toBe(false);
    });

    // 4. Appointment
    it('should book an appointment', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Cookie', `token=${patientToken}`)
            .send({
                doctorId: doctorProfileId,
                date: '2023-12-25',
                startTime: '10:00',
                endTime: '10:30',
                reason: 'Chest pain'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('confirmed');
    });

    it('should show updated availability (slot booked)', async () => {
        const res = await request(app)
            .get(`/api/availability?doctorId=${doctorProfileId}&date=2023-12-25`)
            .set('Cookie', `token=${patientToken}`);

        expect(res.status).toBe(200);
        const bookedSlot = res.body.data.slots.find((s: any) => s.startTime === '10:00');
        expect(bookedSlot.isBooked).toBe(true);
    });

    it('should fail to book the same slot again', async () => {
        const res = await request(app)
            .post('/api/appointments')
            .set('Cookie', `token=${patientToken}`)
            .send({
                doctorId: doctorProfileId,
                date: '2023-12-25',
                startTime: '10:00', // Smae time
                endTime: '10:30',
                reason: 'Double booking attempt'
            });

        expect(res.status).toBe(400); // Should fail
        expect(res.body.message).toMatch(/booked/i);
    });

    it('should list patient appointments', async () => {
        const res = await request(app)
            .get('/api/appointments/my-appointments')
            .set('Cookie', `token=${patientToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].startTime).toBe('10:00');
    });
});
