"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const appointment_repository_1 = require("../repositories/appointment.repository");
const availability_repository_1 = require("../repositories/availability.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
class AppointmentService {
    constructor() {
        this.appointmentRepo = new appointment_repository_1.AppointmentRepository();
        this.availabilityRepo = new availability_repository_1.AvailabilityRepository();
        this.doctorRepo = new doctor_repository_1.DoctorRepository();
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
}
exports.AppointmentService = AppointmentService;
