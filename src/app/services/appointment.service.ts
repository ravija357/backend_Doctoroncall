import { AppointmentRepository } from '../repositories/appointment.repository';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { CreateAppointmentDto } from '../dto/appointment.dto';
import { DoctorRepository } from '../repositories/doctor.repository';

import { NotificationService } from './notification.service';

export class AppointmentService {
    private appointmentRepo = new AppointmentRepository();
    private availabilityRepo = new AvailabilityRepository();
    private doctorRepo = new DoctorRepository();
    private notificationService = new NotificationService();

    async createAppointment(patientId: string, dto: CreateAppointmentDto) {
        const { doctorId, date, startTime, endTime } = dto;
        const appointmentDate = new Date(date);

        // 1. Verify Doctor exists
        const doctor = await this.doctorRepo.findById(doctorId);
        if (!doctor) throw new Error('Doctor not found');

        // 2. Try to lock/book the slot atomically
        const booked = await this.availabilityRepo.bookSlot(doctorId, appointmentDate, startTime);
        if (!booked) {
            throw new Error('Slot already booked or not available');
        }

        try {
            // 3. Create Appointment
            const appointment = await this.appointmentRepo.create({
                patient: patientId as any,
                doctor: doctorId as any,
                date: appointmentDate,
                startTime,
                endTime,
                reason: dto.reason,
                status: 'confirmed'
            });

            // Notify Doctor
            // doctor.user is the User ObjectId
            await this.notificationService.createNotification({
                recipient: (doctor.user as any).toString(),
                message: `New appointment detailed for ${date} at ${startTime}`,
                type: 'INFO',
                relatedId: appointment._id.toString(),
                link: `/doctor/appointments`
            });

            return appointment;
        } catch (error) {
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
        return this.appointmentRepo.updateStatus(id, status);
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

        return this.appointmentRepo.deleteById(id);
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
        const message = userId === patientId
            ? `Appointment cancelled by patient`
            : `Appointment cancelled by doctor`;

        await this.notificationService.createNotification({
            recipient: notifyRecipientId,
            message: message,
            type: 'WARNING',
            relatedId: id,
            link: `/appointments`
        });

        return updatedAppointment;
    }
}
