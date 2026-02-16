"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    doctorId: zod_1.z.string().min(1, 'Doctor ID is required'),
    appointmentId: zod_1.z.string().min(1, 'Appointment ID is required'),
    rating: zod_1.z.number().min(1).max(5),
    comment: zod_1.z.string().max(500).optional(),
});
