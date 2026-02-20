"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const appointment_repository_1 = require("../repositories/appointment.repository");
const availability_repository_1 = require("../repositories/availability.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const notification_service_1 = require("./notification.service");
class AppointmentService {
    constructor() {
        this.appointmentRepo = new appointment_repository_1.AppointmentRepository();
        this.availabilityRepo = new availability_repository_1.AvailabilityRepository();
        this.doctorRepo = new doctor_repository_1.DoctorRepository();
        this.notificationService = new notification_service_1.NotificationService();
    }
    async createAppointment(patientId, dto) {
        const { doctorId, date, startTime, endTime } = dto;
        const appointmentDate = new Date(date);
        // 1. Verify Doctor exists
        const doctor = await this.doctorRepo.findById(doctorId);
        if (!doctor)
            throw new Error('Doctor not found');
        // 2. Try to lock/book the slot atomically
        const booked = await this.availabilityRepo.bookSlot(doctorId, appointmentDate, startTime);
        if (!booked) {
            throw new Error('Slot already booked or not available');
        }
        try {
            // 3. Create Appointment
            const appointment = await this.appointmentRepo.create({
                patient: patientId,
                doctor: doctorId,
                date: appointmentDate,
                startTime,
                endTime,
                reason: dto.reason,
                status: 'confirmed'
            });
            // Notify Doctor
            // doctor.user is the User ObjectId
            await this.notificationService.createNotification({
                recipient: doctor.user.toString(),
                message: `New appointment detailed for ${date} at ${startTime}`,
                type: 'INFO',
                relatedId: appointment._id.toString(),
                link: `/doctor/appointments`
            });
            return appointment;
        }
        catch (error) {
            // Compensation: Unbook the slot if appointment creation fails
            await this.availabilityRepo.unbookSlot(doctorId, appointmentDate, startTime);
            throw error;
        }
    }
    async getMyAppointments(patientId) {
        return this.appointmentRepo.findByPatientId(patientId);
    }
    async getDoctorAppointments(doctorId) {
        return this.appointmentRepo.findByDoctorId(doctorId);
    }
    async updateStatus(id, status) {
        return this.appointmentRepo.updateStatus(id, status);
    }
    async deleteAppointment(id, userId) {
        const appointment = await this.appointmentRepo.findById(id);
        if (!appointment)
            throw new Error('Appointment not found');
        // Ensure only the patient (user) or the doctor can delete the appointment
        const patientId = appointment.patient._id.toString();
        // Handle both populated and unpopulated doctor user field
        const doctorUserId = appointment.doctor.user?._id?.toString() || appointment.doctor.user?.toString();
        if (patientId !== userId && doctorUserId !== userId) {
            throw new Error('Unauthorized to delete this appointment');
        }
        return this.appointmentRepo.deleteById(id);
    }
    async cancelAppointment(id, userId) {
        const appointment = await this.appointmentRepo.findById(id);
        if (!appointment)
            throw new Error('Appointment not found');
        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            throw new Error('Appointment is already cancelled');
        }
        // Authorization
        const patientId = appointment.patient._id.toString();
        const doctorUserId = appointment.doctor.user?._id?.toString() || appointment.doctor.user?.toString();
        if (patientId !== userId && doctorUserId !== userId) {
            throw new Error('Unauthorized to cancel this appointment');
        }
        // Update status to cancelled
        const updatedAppointment = await this.appointmentRepo.updateStatus(id, 'cancelled');
        // Unbook the slot
        const doctorId = appointment.doctor._id.toString();
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
exports.AppointmentService = AppointmentService;
