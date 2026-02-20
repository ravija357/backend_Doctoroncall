"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.cancelAppointment = exports.deleteAppointment = exports.getDoctorAppointments = exports.getMyAppointments = exports.createAppointment = void 0;
const appointment_service_1 = require("../services/appointment.service");
const doctor_service_1 = require("../services/doctor.service");
const appointment_dto_1 = require("../dto/appointment.dto");
const appointmentService = new appointment_service_1.AppointmentService();
const doctorService = new doctor_service_1.DoctorService();
const createAppointment = async (req, res) => {
    const validation = appointment_dto_1.createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }
    try {
        const appointment = await appointmentService.createAppointment(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: appointment });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createAppointment = createAppointment;
const getMyAppointments = async (req, res) => {
    try {
        const appointments = await appointmentService.getMyAppointments(req.user.id);
        return res.json({ success: true, data: appointments });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyAppointments = getMyAppointments;
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const appointments = await appointmentService.getDoctorAppointments(doctor._id.toString());
        return res.json({ success: true, data: appointments });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        await appointmentService.deleteAppointment(id, req.user.id);
        return res.json({ success: true, message: 'Appointment deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteAppointment = deleteAppointment;
const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentService.cancelAppointment(id, req.user.id);
        return res.json({ success: true, data: appointment, message: 'Appointment cancelled successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.cancelAppointment = cancelAppointment;
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Basic validation
        if (!['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const appointment = await appointmentService.updateStatus(id, status);
        return res.json({ success: true, data: appointment, message: 'Status updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateStatus = updateStatus;
