import Notification, { INotification } from '../models/Notification.model';
import { sendNotificationToUser } from '../socket/socket.controller';

export class NotificationService {
    async createNotification(data: {
        recipient: string;
        message: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
        relatedId?: string;
        link?: string;
    }): Promise<INotification> {
        const notification = await Notification.create({
            recipient: data.recipient,
            message: data.message,
            type: data.type,
            relatedId: data.relatedId,
            link: data.link,
            isRead: false
        });

        // Send Real-time update
        sendNotificationToUser(data.recipient.toString(), notification);

        return notification;
    }
}
