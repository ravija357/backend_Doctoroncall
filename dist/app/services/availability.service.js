"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const doctor_repository_1 = require("../repositories/doctor.repository");
const slot_generator_util_1 = require("../utils/slot-generator.util");
const availability_repository_1 = require("../repositories/availability.repository");
class AvailabilityService {
    constructor() {
        this.repo = new availability_repository_1.AvailabilityRepository();
        this.doctorRepo = new doctor_repository_1.DoctorRepository();
    }
    async setAvailability(doctorId, dto) {
        return this.repo.createOrUpdate(doctorId, new Date(dto.date), dto.slots);
    }
    async getAvailability(doctorId, dateStr) {
        const date = new Date(dateStr);
        let availability = await this.repo.findByDoctorAndDate(doctorId, date);
        if (!availability) {
            const doctor = await this.doctorRepo.findById(doctorId);
            if (!doctor)
                throw new Error('Doctor not found');
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const schedule = doctor.schedules.find((s) => s.day === dayName);
            if (schedule && !schedule.isOff) {
                const slots = (0, slot_generator_util_1.generateSlots)(date, schedule.startTime, schedule.endTime);
                availability = await this.repo.createOrUpdate(doctorId, date, slots);
            }
        }
        return availability;
    }
    async getAllAvailability(doctorId) {
        return this.repo.getAvailability(doctorId);
    }
}
exports.AvailabilityService = AvailabilityService;
