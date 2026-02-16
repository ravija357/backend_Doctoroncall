import Appointment, { IAppointment } from '../models/Appointment.model';

export class AppointmentRepository {
    async create(data: Partial<IAppointment>): Promise<IAppointment> {
        return Appointment.create(data);
    }

    async findByDoctorAndDate(doctorId: string, date: Date): Promise<IAppointment[]> {
        return Appointment.find({ doctor: doctorId, date });
    }

    async findByPatientId(patientId: string): Promise<IAppointment[]> {
        return Appointment.find({ patient: patientId })
            .populate({
                path: 'doctor',
                populate: { path: 'user' }
            })
            .sort({ date: -1 });
    }

    async findByDoctorId(doctorId: string): Promise<IAppointment[]> {
        return Appointment.find({ doctor: doctorId }).populate('patient', '-password').sort({ date: -1 });
    }

    async updateStatus(id: string, status: string): Promise<IAppointment | null> {
        return Appointment.findByIdAndUpdate(id, { status }, { new: true });
    }

    async findById(id: string): Promise<IAppointment | null> {
        return Appointment.findById(id).populate('doctor').populate('patient', '-password');
    }

    async deleteById(id: string): Promise<any> {
        return Appointment.findByIdAndDelete(id);
    }
}
