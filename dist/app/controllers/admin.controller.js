"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const Doctor_model_1 = __importDefault(require("../models/Doctor.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AdminController {
    async createUser(req, res) {
        const { email, password, role } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User_model_1.default.create({
            email,
            password: hashedPassword,
            role,
            image: req.file ? `/uploads/${req.file.filename}` : null,
        });
        res.status(201).json(user);
    }
    async getUsers(_req, res) {
        const users = await User_model_1.default.find().select('-password');
        res.json(users);
    }
    async getUserById(req, res) {
        const user = await User_model_1.default.findById(req.params.id).select('-password');
        res.json(user);
    }
    async updateUser(req, res) {
        const data = req.body;
        if (req.file) {
            data.image = `/uploads/${req.file.filename}`;
        }
        const user = await User_model_1.default.findByIdAndUpdate(req.params.id, data, {
            new: true,
        }).select('-password');
        res.json(user);
    }
    async deleteUser(req, res) {
        await User_model_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    }
    async verifyDoctor(req, res) {
        try {
            const { id } = req.params;
            // Find doctor by user ID or doctor ID? Route params usually ID.
            // Let's assume ID is Doctor ID for specificity, or User ID.
            // Given it's admin/doctors/:id, let's allow passing Doctor ID.
            // const Doctor = require('../models/Doctor.model').default; // Dynamic import to avoid circular dependency if any? No, just standard import
            const doctor = await Doctor_model_1.default.findById(id);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor profile not found' });
            }
            doctor.isVerified = true;
            await doctor.save();
            return res.json({ success: true, message: 'Doctor verified successfully', data: doctor });
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AdminController = AdminController;
