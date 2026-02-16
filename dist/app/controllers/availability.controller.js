"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = exports.setAvailability = void 0;
const availability_service_1 = require("../services/availability.service");
const doctor_service_1 = require("../services/doctor.service");
const availability_dto_1 = require("../dto/availability.dto");
const availabilityService = new availability_service_1.AvailabilityService();
const doctorService = new doctor_service_1.DoctorService();
const setAvailability = async (req, res) => {
    const validation = availability_dto_1.availabilitySchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }
    try {
        const doctor = await doctorService.getProfile(req.user.id);
        if (!doctor)
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        const availability = await availabilityService.setAvailability(doctor._id.toString(), validation.data);
        return res.status(200).json({ success: true, data: availability });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.setAvailability = setAvailability;
const getAvailability = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date)
            return res.status(400).json({ success: false, message: 'Doctor ID and Date required' });
        const availability = await availabilityService.getAvailability(doctorId, date);
        return res.json({ success: true, data: availability });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAvailability = getAvailability;
