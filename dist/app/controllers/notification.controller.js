"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification_model_1.default.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications
        const unreadCount = await Notification_model_1.default.countDocuments({ recipient: req.user.id, isRead: false });
        return res.json({ success: true, data: notifications, unreadCount });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserNotifications = getUserNotifications;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification_model_1.default.findByIdAndUpdate(id, { isRead: true });
        return res.json({ success: true, message: 'Marked as read' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_model_1.default.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
        return res.json({ success: true, message: 'All marked as read' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
