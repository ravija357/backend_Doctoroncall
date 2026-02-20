import { Request, Response } from 'express';
import { DoctorService } from '../services/doctor.service';
import { doctorSchema } from '../dto/doctor.dto';

const doctorService = new DoctorService();

export const createProfile = async (req: Request | any, res: Response) => {
    const validation = doctorSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const doctor = await doctorService.createProfile(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: doctor });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getProfile = async (req: Request | any, res: Response) => {
    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return res.json({ success: true, data: doctor });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllDoctors = async (req: Request, res: Response) => {
    try {
        const filters = req.query;
        const doctors = await doctorService.getAllDoctors(filters);
        return res.json({ success: true, count: doctors.length, data: doctors });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDoctorById = async (req: Request, res: Response) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        return res.json({ success: true, data: doctor });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

import { getIO } from '../socket/socket.controller';

// ... (existing imports)

export const updateSchedule = async (req: Request | any, res: Response) => {
    try {
        const { schedules } = req.body;
        // Basic validation for now, relying on service or adding explicit DTO check if needed
        if (!schedules || !Array.isArray(schedules)) {
            return res.status(400).json({ success: false, message: 'Invalid schedule format' });
        }

        const doctor = await doctorService.updateSchedule(req.user.id, schedules);

        // Notify clients about schedule update
        if (doctor) {
            try {
                const io = getIO();
                io.emit('schedule_updated', { doctorId: doctor._id });
            } catch (err) {
                console.error('[SOCKET] Failed to emit schedule_updated:', err);
            }
        }

        return res.json({ success: true, data: doctor });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
