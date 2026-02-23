import { z } from 'zod';

export const doctorSchema = z.object({
    specialization: z.string().min(1, 'Specialization is required'),
    experience: z.number().min(0, 'Experience must be a positive number'),
    qualifications: z.array(z.string()).min(1, 'At least one qualification is required'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    fees: z.number().min(0, 'Fees must be a positive number'),
    hospital: z.string().optional(),
    schedules: z.array(z.object({
        day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        isOff: z.boolean().default(false),
    })).min(1, 'At least one schedule day is required'),
    totalPatients: z.number().optional(),
    totalVisits: z.number().optional(),
    onlineConsultations: z.number().optional(),
});

export type DoctorDto = z.infer<typeof doctorSchema>;
