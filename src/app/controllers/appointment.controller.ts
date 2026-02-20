import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { DoctorService } from '../services/doctor.service';
import { createAppointmentSchema } from '../dto/appointment.dto';

const appointmentService = new AppointmentService();
const doctorService = new DoctorService();

export const createAppointment = async (req: Request | any, res: Response) => {
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const appointment = await appointmentService.createAppointment(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: appointment });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyAppointments = async (req: Request | any, res: Response) => {
    try {
        const appointments = await appointmentService.getMyAppointments(req.user.id);
        return res.json({ success: true, data: appointments });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDoctorAppointments = async (req: Request | any, res: Response) => {
    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

        const appointments = await appointmentService.getDoctorAppointments(doctor._id.toString());
        return res.json({ success: true, data: appointments });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
export const deleteAppointment = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        await appointmentService.deleteAppointment(id, req.user.id);
        return res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelAppointment = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentService.cancelAppointment(id, req.user.id);
        return res.json({ success: true, data: appointment, message: 'Appointment cancelled successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Basic validation
        if (!['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const appointment = await appointmentService.updateStatus(id, status);
        return res.json({ success: true, data: appointment, message: 'Status updated successfully' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
