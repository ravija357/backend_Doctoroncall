"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityRepository = void 0;
const Availability_model_1 = __importDefault(require("../models/Availability.model"));
class AvailabilityRepository {
    async createOrUpdate(doctorId, date, slots) {
        return Availability_model_1.default.findOneAndUpdate({ doctor: doctorId, date }, { slots }, { new: true, upsert: true });
    }
    async findByDoctorAndDate(doctorId, date) {
        return Availability_model_1.default.findOne({ doctor: doctorId, date });
    }
    async getAvailability(doctorId) {
        return Availability_model_1.default.find({ doctor: doctorId });
    }
    async bookSlot(doctorId, date, startTime) {
        const result = await Availability_model_1.default.updateOne({
            doctor: doctorId,
            date,
            "slots.startTime": startTime,
            "slots.isBooked": false
        }, { $set: { "slots.$.isBooked": true } });
        return result.modifiedCount > 0;
    }
    async unbookSlot(doctorId, date, startTime) {
        await Availability_model_1.default.updateOne({ doctor: doctorId, date, "slots.startTime": startTime }, { $set: { "slots.$.isBooked": false } });
    }
}
exports.AvailabilityRepository = AvailabilityRepository;
