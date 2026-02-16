"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMedicalHistorySchema = void 0;
const zod_1 = require("zod");
exports.createMedicalHistorySchema = zod_1.z.object({
    patientId: zod_1.z.string().min(1, 'Patient ID is required'),
    appointmentId: zod_1.z.string().optional(),
    diagnosis: zod_1.z.string().min(1, 'Diagnosis is required'),
    prescription: zod_1.z.string().min(1, 'Prescription is required'),
    notes: zod_1.z.string().optional(),
});
