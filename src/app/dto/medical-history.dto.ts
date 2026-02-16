import { z } from 'zod';

export const createMedicalHistorySchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    appointmentId: z.string().optional(),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    prescription: z.string().min(1, 'Prescription is required'),
    notes: z.string().optional(),
});

export type CreateMedicalHistoryDto = z.infer<typeof createMedicalHistorySchema>;
