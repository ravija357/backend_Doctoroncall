"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorSchema = void 0;
const zod_1 = require("zod");
exports.doctorSchema = zod_1.z.object({
    specialization: zod_1.z.string().min(1, 'Specialization is required'),
    experience: zod_1.z.number().min(0, 'Experience must be a positive number'),
    qualifications: zod_1.z.array(zod_1.z.string()).min(1, 'At least one qualification is required'),
    bio: zod_1.z.string().min(10, 'Bio must be at least 10 characters'),
    fees: zod_1.z.number().min(0, 'Fees must be a positive number'),
    hospital: zod_1.z.string().optional(),
    schedules: zod_1.z.array(zod_1.z.object({
        day: zod_1.z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        isOff: zod_1.z.boolean().default(false),
    })).min(1, 'At least one schedule day is required'),
});
