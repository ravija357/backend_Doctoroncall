"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.logout = exports.getMe = exports.register = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const User_model_1 = __importDefault(require("../models/User.model"));
const authService = new auth_service_1.AuthService();
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const result = await authService.login({ email, password, role });
        res.cookie('token', result.token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            success: true,
            user: result.user,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(201).json({
            success: true,
            user: result.user,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};
exports.register = register;
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
};
exports.getMe = getMe;
const logout = async (_req, res) => {
    res.clearCookie('token');
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
};
exports.logout = logout;
const updateProfile = async (req, res) => {
    try {
        const data = req.body;
        if (req.file) {
            data.image = `/uploads/${req.file.filename}`;
        }
        const user = await User_model_1.default.findByIdAndUpdate(req.params.id, data, {
            new: true,
        }).select('-password');
        return res.json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
exports.updateProfile = updateProfile;
