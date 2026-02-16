"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctorRecords = exports.getMyHistory = exports.createRecord = void 0;
const medical_history_service_1 = require("../services/medical-history.service");
const medical_history_dto_1 = require("../dto/medical-history.dto");
const historyService = new medical_history_service_1.MedicalHistoryService();
const createRecord = async (req, res) => {
    const validation = medical_history_dto_1.createMedicalHistorySchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }
    try {
        // Only doctors can create
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Only doctors can create medical records' });
        }
        const record = await historyService.createRecord(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createRecord = createRecord;
const getMyHistory = async (req, res) => {
    try {
        const history = await historyService.getPatientHistory(req.user.id);
        return res.json({ success: true, data: history });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMyHistory = getMyHistory;
const getDoctorRecords = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const records = await historyService.getRecordsByDoctor(req.user.id);
        return res.json({ success: true, data: records });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDoctorRecords = getDoctorRecords;
