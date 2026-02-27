import { DoctorRepository } from '../repositories/doctor.repository';
import { DoctorDto } from '../dto/doctor.dto';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../socket/socket.controller';

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
        const updated = await this.repo.update(id, data);
        if (updated && updated.user) {
            const userId = (updated.user as any)._id?.toString() || (updated.user as any).toString();
            try {
                emitToUser(userId, 'profile_sync', { id: updated._id });
            } catch (err) {
                console.warn('[SOCKET] Could not emit profile_sync:', err);
            }
        }
        return updated;
    }

    async updateSchedule(userId: string, schedules: DoctorDto['schedules']) {
        const doctor = await this.repo.findByUserId(userId);
        if (!doctor) throw new AppError('Doctor not found', 404);

        // TODO: Trigger availability regeneration here

        const updated = await this.repo.update(doctor._id.toString(), { schedules } as any);
        if (updated) {
            try {
                emitToUser(userId, 'schedule_sync', { id: doctor._id });
            } catch (err) {
                console.warn('[SOCKET] Could not emit schedule_sync:', err);
            }
        }
        return updated;
    }
}
