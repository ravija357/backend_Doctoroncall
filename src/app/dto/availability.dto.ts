import { z } from 'zod';

export const availabilitySchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    slots: z.array(z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    })).min(1, 'At least one slot is required'),
});

export type AvailabilityDto = z.infer<typeof availabilitySchema>;
