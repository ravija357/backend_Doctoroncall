"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalHistoryService = void 0;
const MedicalHistory_model_1 = __importDefault(require("../models/MedicalHistory.model"));
const Doctor_model_1 = __importDefault(require("../models/Doctor.model"));
class MedicalHistoryService {
    async createRecord(doctorUserId, dto) {
        const doctor = await Doctor_model_1.default.findOne({ user: doctorUserId });
        if (!doctor)
            throw new Error('Doctor profile not found');
        // Ideally, check if patient has an appointment with this doctor to allow creating record.
        // For now, assuming doctor can add record for any patient they "treat".
        return MedicalHistory_model_1.default.create({
            patient: dto.patientId,
            doctor: doctor._id,
            appointment: dto.appointmentId,
            diagnosis: dto.diagnosis,
            prescription: dto.prescription,
            notes: dto.notes
        });
    }
    async getPatientHistory(patientId) {
        return MedicalHistory_model_1.default.find({ patient: patientId })
            .populate('doctor', 'specialization')
            .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } })
            .sort({ date: -1 });
    }
    async getRecordsByDoctor(doctorUserId) {
        const doctor = await Doctor_model_1.default.findOne({ user: doctorUserId });
        if (!doctor)
            throw new Error('Doctor profile not found');
        return MedicalHistory_model_1.default.find({ doctor: doctor._id })
            .populate('patient', 'firstName lastName email image')
            .sort({ date: -1 });
    }
}
exports.MedicalHistoryService = MedicalHistoryService;
