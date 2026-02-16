"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const doctor_repository_1 = require("../repositories/doctor.repository");
const AppError_1 = require("../utils/AppError");
class DoctorService {
    constructor() {
        this.repo = new doctor_repository_1.DoctorRepository();
    }
    async createProfile(userId, data) {
        const existingDoctor = await this.repo.findByUserId(userId);
        if (existingDoctor) {
            throw new Error('Doctor profile already exists');
        }
        return this.repo.create({ ...data, user: userId });
    }
    async getProfile(userId) {
        return this.repo.findByUserId(userId);
    }
    async getDoctorById(id) {
        return this.repo.findById(id);
    }
    async getAllDoctors(filters) {
        return this.repo.findAllWithFilters(filters);
    }
    async updateProfile(id, data) {
        return this.repo.update(id, data);
    }
    async updateSchedule(userId, schedules) {
        const doctor = await this.repo.findByUserId(userId);
        if (!doctor)
            throw new AppError_1.AppError('Doctor not found', 404);
        // TODO: Trigger availability regeneration here
        return this.repo.update(doctor._id.toString(), { schedules });
    }
}
exports.DoctorService = DoctorService;
