import { DoctorRepository } from '../repositories/doctor.repository';
import { generateSlots } from '../utils/slot-generator.util';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { AvailabilityDto } from '../dto/availability.dto';

export class AvailabilityService {
    private repo = new AvailabilityRepository();

    async setAvailability(doctorId: string, dto: AvailabilityDto) {
        return this.repo.createOrUpdate(doctorId, new Date(dto.date), dto.slots);
    }

    private doctorRepo = new DoctorRepository();

    async getAvailability(doctorId: string, dateStr: string) {
        const date = new Date(dateStr);
        let availability = await this.repo.findByDoctorAndDate(doctorId, date);

        if (!availability) {
            const doctor = await this.doctorRepo.findById(doctorId);
            if (!doctor) throw new Error('Doctor not found');

            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = doctor.schedules.find((s: any) => s.day === dayName);

            if (schedule && !schedule.isOff) {
                const slots = generateSlots(date, schedule.startTime, schedule.endTime);
                availability = await this.repo.createOrUpdate(doctorId, date, slots);
            }
        }

        return availability;
    }

    async getAllAvailability(doctorId: string) {
        return this.repo.getAvailability(doctorId);
    }
}
