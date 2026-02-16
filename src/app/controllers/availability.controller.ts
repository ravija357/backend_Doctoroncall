import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availability.service';
import { DoctorService } from '../services/doctor.service';
import { availabilitySchema } from '../dto/availability.dto';

const availabilityService = new AvailabilityService();
const doctorService = new DoctorService();

export const setAvailability = async (req: Request | any, res: Response) => {
    const validation = availabilitySchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

        const availability = await availabilityService.setAvailability(doctor._id.toString(), validation.data);
        return res.status(200).json({ success: true, data: availability });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAvailability = async (req: Request, res: Response) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) return res.status(400).json({ success: false, message: 'Doctor ID and Date required' });

        const availability = await availabilityService.getAvailability(doctorId as string, date as string);
        return res.json({ success: true, data: availability });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
