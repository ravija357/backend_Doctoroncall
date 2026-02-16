import { z } from 'zod';

export const createReviewSchema = z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    rating: z.number().min(1).max(5),
    comment: z.string().max(500).optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
