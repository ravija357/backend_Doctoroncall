import { AppointmentRepository } from '../repositories/appointment.repository';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { CreateAppointmentDto } from '../dto/appointment.dto';
import { DoctorRepository } from '../repositories/doctor.repository';
import { generateSlots } from '../utils/slot-generator.util';
import mongoose from 'mongoose';

import { NotificationService } from './notification.service';
import { getIO, emitToUser } from '../socket/socket.controller';

export class AppointmentService {
    private appointmentRepo = new AppointmentRepository();
    private availabilityRepo = new AvailabilityRepository();
    private doctorRepo = new DoctorRepository();
    private notificationService = new NotificationService();

    async createAppointment(patientId: string, dto: CreateAppointmentDto) {
        const { doctorId, date, startTime, endTime } = dto;
        // Parse date as pure UTC so '2026-02-28' doesn't shift to '2026-02-27T19:00:00Z' locally
        const appointmentDate = new Date(`${date}T00:00:00Z`);

        // 1. Verify Doctor exists
        const doctor = await this.doctorRepo.findById(doctorId);
        if (!doctor) throw new Error('Doctor not found');

        // 2. Ensure availability record exists before booking
        let availability = await this.availabilityRepo.findByDoctorAndDate(doctorId, appointmentDate);
        if (!availability) {
            // Auto-generate slots from doctor's schedule or use defaults
            const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = doctor.schedules.find((s: any) => s.day === dayName);

            let slots: any[];
            if (schedule && !schedule.isOff) {
                slots = generateSlots(appointmentDate, schedule.startTime, schedule.endTime);
            } else {
                // Default 9am-5pm, 30-min slots
                slots = generateSlots(appointmentDate, '09:00', '17:00');
            }
            availability = await this.availabilityRepo.createOrUpdate(doctorId, appointmentDate, slots);
        }

        // 3. Try to lock/book the slot atomically
        const booked = await this.availabilityRepo.bookSlot(doctorId, appointmentDate, startTime);
        if (!booked) {
            throw new Error('Slot already booked or not available');
        }

        try {
            // 3. Create Appointment
            const appointment = await this.appointmentRepo.create({
                patient: new mongoose.Types.ObjectId(patientId) as any,
                doctor: doctor._id,
                date: appointmentDate,
                startTime,
                endTime,
                reason: dto.reason,
                status: 'pending'
            });

            // Update Doctor Stats (Atomic increment)
            await this.doctorRepo.update(doctorId, {
                $inc: {
                    totalVisits: 1,
                    totalPatients: 1,
                    totalRevenue: doctor.fees || 0
                }
            } as any);

            // Notify Doctor
            // doctor.user may be populated or just an ObjectId
            const doctorUserId = (doctor.user as any)._id?.toString() || (doctor.user as any).toString();
            await this.notificationService.createNotification({
                recipient: doctorUserId,
                message: `New appointment scheduled for ${date} at ${startTime}`,
                type: 'INFO',
                relatedId: appointment._id.toString(),
                link: `/doctor/appointments`
            });

            // Notify Patient
            await this.notificationService.createNotification({
                recipient: patientId as string,
                message: `Your appointment is confirmed for ${date} at ${startTime}`,
                type: 'SUCCESS',
                relatedId: appointment._id.toString(),
                link: `/appointments`
            });

            // Emit socket event for real-time dashboard updates (Facebook-like sync)
            try {
                // Notify both Patient and Doctor rooms
                emitToUser(patientId, 'appointment_sync', { id: appointment._id });
                emitToUser(doctorUserId, 'appointment_sync', { id: appointment._id });
            } catch (err) {
                console.warn('[SOCKET] Could not emit appointment_sync:', err);
            }

            return appointment;
        } catch (error: any) {
            console.error(`[DEBUG] Appointment Creation Error:`, error.message);
            // Compensation: Unbook the slot if appointment creation fails
            await this.availabilityRepo.unbookSlot(doctorId, appointmentDate, startTime);
            throw error;
        }
    }

    async getMyAppointments(patientId: string) {
        return this.appointmentRepo.findByPatientId(patientId);
    }

    async getDoctorAppointments(doctorId: string) {
        return this.appointmentRepo.findByDoctorId(doctorId);
    }

    async updateStatus(id: string, status: string) {
        const updated = await this.appointmentRepo.updateStatus(id, status);
        if (updated) {
            try {
                const doctorUserId = (updated.doctor as any).user?._id?.toString() || (updated.doctor as any).user?.toString();
                const patientId = (updated.patient as any)._id?.toString() || updated.patient.toString();

                // Notify both Patient and Doctor rooms
                if (patientId) emitToUser(patientId, 'appointment_sync', { id: updated._id, status });
                if (doctorUserId) emitToUser(doctorUserId, 'appointment_sync', { id: updated._id, status });
            } catch (err) {
                console.warn('[SOCKET] Could not emit appointment_sync:', err);
            }
        }
        return updated;
    }

    async deleteAppointment(id: string, userId: string) {
        const appointment = await this.appointmentRepo.findById(id);
        if (!appointment) throw new Error('Appointment not found');

        // Ensure only the patient (user) or the doctor can delete the appointment
        const patientId = (appointment.patient as any)._id.toString();
        // Handle both populated and unpopulated doctor user field
        const doctorUserId = (appointment.doctor as any).user?._id?.toString() || (appointment.doctor as any).user?.toString();

        if (patientId !== userId && doctorUserId !== userId) {
            throw new Error('Unauthorized to delete this appointment');
        }

        const deleted = await this.appointmentRepo.deleteById(id);
        if (deleted) {
            try {
                emitToUser(patientId, 'appointment_sync', { id, status: 'deleted' });
                emitToUser(doctorUserId, 'appointment_sync', { id, status: 'deleted' });
            } catch (err) {
                console.warn('[SOCKET] Could not emit appointment_sync:', err);
            }
        }
        return deleted;
    }

    async cancelAppointment(id: string, userId: string) {
        const appointment = await this.appointmentRepo.findById(id);
        if (!appointment) throw new Error('Appointment not found');

        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            throw new Error('Appointment is already cancelled');
        }

        // Authorization
        const patientId = (appointment.patient as any)._id.toString();
        const doctorUserId = (appointment.doctor as any).user?._id?.toString() || (appointment.doctor as any).user?.toString();
        if (patientId !== userId && doctorUserId !== userId) {
            throw new Error('Unauthorized to cancel this appointment');
        }

        // Update status to cancelled
        const updatedAppointment = await this.appointmentRepo.updateStatus(id, 'cancelled');

        // Unbook the slot
        const doctorId = (appointment.doctor as any)._id.toString();
        await this.availabilityRepo.unbookSlot(doctorId, appointment.date, appointment.startTime);

        // Notify the OTHER party
        const notifyRecipientId = userId === patientId ? doctorUserId : patientId;
        const messageOther = userId === patientId
            ? `Appointment cancelled by patient`
            : `Appointment cancelled by doctor`;

        await this.notificationService.createNotification({
            recipient: notifyRecipientId,
            message: messageOther,
            type: 'WARNING',
            relatedId: id,
            link: `/appointments`
        });

        // Notify the SUBMITTER
        await this.notificationService.createNotification({
            recipient: userId,
            message: `You successfully cancelled the appointment`,
            type: 'SUCCESS',
            relatedId: id,
            link: `/appointments`
        });

        // Emit socket event for real-time dashboard updates
        try {
            emitToUser(patientId, 'appointment_sync', { id, status: 'cancelled' });
            emitToUser(doctorUserId, 'appointment_sync', { id, status: 'cancelled' });
        } catch (err) {
            console.warn('[SOCKET] Could not emit appointment_sync:', err);
        }

        return updatedAppointment;
    }
}
