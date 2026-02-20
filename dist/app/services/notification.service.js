"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const socket_controller_1 = require("../socket/socket.controller");
class NotificationService {
    async createNotification(data) {
        const notification = await Notification_model_1.default.create({
            recipient: data.recipient,
            message: data.message,
            type: data.type,
            relatedId: data.relatedId,
            link: data.link,
            isRead: false
        });
        // Send Real-time update
        (0, socket_controller_1.sendNotificationToUser)(data.recipient.toString(), notification);
        return notification;
    }
}
exports.NotificationService = NotificationService;
