"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
exports.createAppointmentSchema = zod_1.z.object({
    doctorId: zod_1.z.string().min(1, 'Doctor ID is required'),
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    reason: zod_1.z.string().optional(),
});
