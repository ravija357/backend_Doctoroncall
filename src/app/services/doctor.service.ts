import { DoctorRepository } from '../repositories/doctor.repository';
import { DoctorDto } from '../dto/doctor.dto';
import { AppError } from '../utils/AppError';

export class DoctorService {
    private repo = new DoctorRepository();

    async createProfile(userId: string, data: DoctorDto) {
        const existingDoctor = await this.repo.findByUserId(userId);
        if (existingDoctor) {
            throw new Error('Doctor profile already exists');
        }
        return this.repo.create({ ...data, user: userId } as any);
    }

    async getProfile(userId: string) {
        return this.repo.findByUserId(userId);
    }

    async getDoctorById(id: string) {
        return this.repo.findById(id);
    }

    async getAllDoctors(filters: any) {
        return this.repo.findAllWithFilters(filters);
    }

    async updateProfile(id: string, data: Partial<DoctorDto>) {
        return this.repo.update(id, data);
    }

    async updateSchedule(userId: string, schedules: DoctorDto['schedules']) {
        const doctor = await this.repo.findByUserId(userId);
        if (!doctor) throw new AppError('Doctor not found', 404);

        // TODO: Trigger availability regeneration here

        return this.repo.update(doctor._id.toString(), { schedules } as any);
    }
}
