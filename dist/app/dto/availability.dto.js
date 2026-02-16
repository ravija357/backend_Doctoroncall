"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilitySchema = void 0;
const zod_1 = require("zod");
exports.availabilitySchema = zod_1.z.object({
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    slots: zod_1.z.array(zod_1.z.object({
        startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    })).min(1, 'At least one slot is required'),
});
