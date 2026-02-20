"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRepository = void 0;
const Appointment_model_1 = __importDefault(require("../models/Appointment.model"));
class AppointmentRepository {
    async create(data) {
        return Appointment_model_1.default.create(data);
    }
    async findByDoctorAndDate(doctorId, date) {
        return Appointment_model_1.default.find({ doctor: doctorId, date });
    }
    async findByPatientId(patientId) {
        return Appointment_model_1.default.find({ patient: patientId })
            .populate({
            path: 'doctor',
            populate: { path: 'user' }
        })
            .sort({ date: -1 });
    }
    async findByDoctorId(doctorId) {
        return Appointment_model_1.default.find({ doctor: doctorId }).populate('patient', '-password').sort({ date: -1 });
    }
    async updateStatus(id, status) {
        return Appointment_model_1.default.findByIdAndUpdate(id, { status }, { new: true });
    }
    async findById(id) {
        return Appointment_model_1.default.findById(id).populate('doctor').populate('patient', '-password');
    }
    async deleteById(id) {
        return Appointment_model_1.default.findByIdAndDelete(id);
    }
}
exports.AppointmentRepository = AppointmentRepository;
