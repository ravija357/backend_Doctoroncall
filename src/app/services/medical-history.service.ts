import MedicalHistory, { IMedicalHistory } from '../models/MedicalHistory.model';
import Doctor from '../models/Doctor.model';
import { CreateMedicalHistoryDto } from '../dto/medical-history.dto';

export class MedicalHistoryService {

    async createRecord(doctorUserId: string, dto: CreateMedicalHistoryDto) {
        const doctor = await Doctor.findOne({ user: doctorUserId });
        if (!doctor) throw new Error('Doctor profile not found');

        // Ideally, check if patient has an appointment with this doctor to allow creating record.
        // For now, assuming doctor can add record for any patient they "treat".

        return MedicalHistory.create({
            patient: dto.patientId,
            doctor: doctor._id,
            appointment: dto.appointmentId,
            diagnosis: dto.diagnosis,
            prescription: dto.prescription,
            notes: dto.notes
        });
    }

    async getPatientHistory(patientId: string) {
        return MedicalHistory.find({ patient: patientId })
            .populate('doctor', 'specialization')
            .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } })
            .sort({ date: -1 });
    }

    async getRecordsByDoctor(doctorUserId: string) {
        const doctor = await Doctor.findOne({ user: doctorUserId });
        if (!doctor) throw new Error('Doctor profile not found');

        return MedicalHistory.find({ doctor: doctor._id })
            .populate('patient', 'firstName lastName email image')
            .sort({ date: -1 });
    }
}
