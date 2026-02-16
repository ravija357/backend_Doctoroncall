import { Request, Response } from 'express';
import { MedicalHistoryService } from '../services/medical-history.service';
import { createMedicalHistorySchema } from '../dto/medical-history.dto';

const historyService = new MedicalHistoryService();

export const createRecord = async (req: Request | any, res: Response) => {
    const validation = createMedicalHistorySchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        // Only doctors can create
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Only doctors can create medical records' });
        }

        const record = await historyService.createRecord(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyHistory = async (req: Request | any, res: Response) => {
    try {
        const history = await historyService.getPatientHistory(req.user.id);
        return res.json({ success: true, data: history });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDoctorRecords = async (req: Request | any, res: Response) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const records = await historyService.getRecordsByDoctor(req.user.id);
        return res.json({ success: true, data: records });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
