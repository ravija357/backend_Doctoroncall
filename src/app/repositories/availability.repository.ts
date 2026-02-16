import Availability, { IAvailability } from '../models/Availability.model';

export class AvailabilityRepository {
    async createOrUpdate(doctorId: string, date: Date, slots: any[]): Promise<IAvailability> {
        return Availability.findOneAndUpdate(
            { doctor: doctorId, date },
            { slots },
            { new: true, upsert: true }
        );
    }

    async findByDoctorAndDate(doctorId: string, date: Date): Promise<IAvailability | null> {
        return Availability.findOne({ doctor: doctorId, date });
    }

    async getAvailability(doctorId: string): Promise<IAvailability[]> {
        return Availability.find({ doctor: doctorId });
    }

    async bookSlot(doctorId: string, date: Date, startTime: string): Promise<boolean> {
        const result = await Availability.updateOne(
            {
                doctor: doctorId,
                date,
                "slots.startTime": startTime,
                "slots.isBooked": false
            },
            { $set: { "slots.$.isBooked": true } }
        );
        return result.modifiedCount > 0;
    }

    async unbookSlot(doctorId: string, date: Date, startTime: string): Promise<void> {
        await Availability.updateOne(
            { doctor: doctorId, date, "slots.startTime": startTime },
            { $set: { "slots.$.isBooked": false } }
        );
    }
}
