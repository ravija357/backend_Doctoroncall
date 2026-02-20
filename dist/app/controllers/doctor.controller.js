"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchedule = exports.getDoctorById = exports.getAllDoctors = exports.getProfile = exports.createProfile = void 0;
const doctor_service_1 = require("../services/doctor.service");
const doctor_dto_1 = require("../dto/doctor.dto");
const doctorService = new doctor_service_1.DoctorService();
const createProfile = async (req, res) => {
    const validation = doctor_dto_1.doctorSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }
    try {
        const doctor = await doctorService.createProfile(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: doctor });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createProfile = createProfile;
const getProfile = async (req, res) => {
    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        return res.json({ success: true, data: doctor });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProfile = getProfile;
const getAllDoctors = async (req, res) => {
    try {
        const filters = req.query;
        const doctors = await doctorService.getAllDoctors(filters);
        return res.json({ success: true, count: doctors.length, data: doctors });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllDoctors = getAllDoctors;
const getDoctorById = async (req, res) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        return res.json({ success: true, data: doctor });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDoctorById = getDoctorById;
const socket_controller_1 = require("../socket/socket.controller");
// ... (existing imports)
const updateSchedule = async (req, res) => {
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
                const io = (0, socket_controller_1.getIO)();
                io.emit('schedule_updated', { doctorId: doctor._id });
            }
            catch (err) {
                console.error('[SOCKET] Failed to emit schedule_updated:', err);
            }
        }
        return res.json({ success: true, data: doctor });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSchedule = updateSchedule;
