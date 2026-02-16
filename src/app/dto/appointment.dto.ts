import { z } from 'zod';

export const createAppointmentSchema = z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    reason: z.string().optional(),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
