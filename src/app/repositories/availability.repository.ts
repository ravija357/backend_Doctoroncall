import mongoose from 'mongoose';
import Availability, { IAvailability } from '../models/Availability.model';

export class AvailabilityRepository {
    async createOrUpdate(doctorId: string, date: Date, slots: any[]): Promise<IAvailability> {
        const id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;
        return Availability.findOneAndUpdate(
            { doctor: id, date },
            { slots },
            { new: true, upsert: true }
        );
    }

    async findByDoctorAndDate(doctorId: string, date: Date): Promise<IAvailability | null> {
        const id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;
        return Availability.findOne({ doctor: id, date });
    }

    async getAvailability(doctorId: string): Promise<IAvailability[]> {
        const id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;
        return Availability.find({ doctor: id });
    }

    async bookSlot(doctorId: string, date: Date, startTime: string): Promise<boolean> {
        const id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;

        const allAvails = await Availability.find({ doctor: id });
        console.log(`[REPO DEBUG] All dates for doctor ${id}: ${JSON.stringify(allAvails.map(a => a.date.toISOString()))}`);
        console.log(`[REPO DEBUG] Searching for date: ${date.toISOString()}`);

        const avail = await Availability.findOne({ doctor: id, date: date });
        if (!avail) {
            console.log(`[REPO DEBUG] MATCH FAILED for date: ${date.toISOString()}`);
            return false;
        }

        const slotIndex = avail.slots.findIndex((s: any) =>
            String(s.startTime).trim() === String(startTime).trim() && !s.isBooked
        );

        if (slotIndex === -1) {
            console.log(`[REPO DEBUG] SLOT MATCH FAILED: ${startTime}. Available: ${JSON.stringify(avail.slots.map(s => s.startTime + (s.isBooked ? '(B)' : '(F)')))}`);
            return false;
        }

        avail.slots[slotIndex].isBooked = true;
        await avail.save();
        return true;
    }

    async unbookSlot(doctorId: string, date: Date, startTime: string): Promise<void> {
        const id = typeof doctorId === 'string' ? new mongoose.Types.ObjectId(doctorId) : doctorId;
        const avail = await Availability.findOne({ doctor: id, date: date });
        if (avail) {
            const slotIndex = avail.slots.findIndex((s: any) =>
                String(s.startTime).trim() === String(startTime).trim()
            );
            if (slotIndex !== -1) {
                avail.slots[slotIndex].isBooked = false;
                await avail.save();
            }
        }
    }
}
