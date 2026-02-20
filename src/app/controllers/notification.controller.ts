import { Request, Response } from 'express';
import Notification from '../models/Notification.model';

export const getUserNotifications = async (req: Request | any, res: Response) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

        return res.json({ success: true, data: notifications, unreadCount });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAsRead = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        return res.json({ success: true, message: 'Marked as read' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const markAllAsRead = async (req: Request | any, res: Response) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
        return res.json({ success: true, message: 'All marked as read' });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
