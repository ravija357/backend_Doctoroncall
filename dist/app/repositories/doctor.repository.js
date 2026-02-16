"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepository = void 0;
const Doctor_model_1 = __importDefault(require("../models/Doctor.model"));
class DoctorRepository {
    async create(data) {
        return Doctor_model_1.default.create(data);
    }
    async findByUserId(userId) {
        return Doctor_model_1.default.findOne({ user: userId });
    }
    async findById(id) {
        return Doctor_model_1.default.findById(id).populate('user', '-password');
    }
    async findAllWithFilters(filters) {
        const query = {};
        if (filters.specialization) {
            query.specialization = { $regex: filters.specialization, $options: 'i' };
        }
        if (filters.minFee || filters.maxFee) {
            query.fees = {};
            if (filters.minFee)
                query.fees.$gte = Number(filters.minFee);
            if (filters.maxFee)
                query.fees.$lte = Number(filters.maxFee);
        }
        if (filters.experience) {
            query.experience = { $gte: Number(filters.experience) };
        }
        if (filters.name) {
            // Requires looking up specific user. 
            // For now, simpler to do population filter or aggregation if we want to filter by user name.
            // We can defer name search or do a 2-step lookup.
            // Let's stick to filters on Doctor model fields for now + bio search
            query.bio = { $regex: filters.name, $options: 'i' };
        }
        return Doctor_model_1.default.find(query).populate('user', '-password');
    }
    async findAll() {
        return Doctor_model_1.default.find().populate('user', '-password');
    }
    async update(id, data) {
        return Doctor_model_1.default.findByIdAndUpdate(id, data, { new: true });
    }
}
exports.DoctorRepository = DoctorRepository;
