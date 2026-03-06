import { NotificationService } from '../../app/services/notification.service';
import Notification from '../../app/models/Notification.model';
import { sendNotificationToUser } from '../../app/socket/socket.controller';

jest.mock('../../app/models/Notification.model', () => ({
    create: jest.fn(),
}));

jest.mock('../../app/socket/socket.controller', () => ({
    sendNotificationToUser: jest.fn(),
}));

describe('NotificationService Unit Tests', () => {
    let service: NotificationService;

    beforeEach(() => {
        service = new NotificationService();
        jest.clearAllMocks();
    });

    it('should create a notification successfully', async () => {
        // Arrange
        const mockData = {
            recipient: 'user123',
            message: 'Test Message',
            type: 'SUCCESS' as const,
        };

        const mockNotification = {
            _id: 'notif123',
            ...mockData,
            isRead: false,
        };

        (Notification.create as jest.Mock).mockResolvedValue(mockNotification);

        // Act
        const result = await service.createNotification(mockData);

        // Assert
        expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
            recipient: 'user123',
            message: 'Test Message',
            type: 'SUCCESS',
            isRead: false,
        }));

        expect(sendNotificationToUser).toHaveBeenCalledWith('user123', mockNotification);
        expect(result).toEqual(mockNotification);
    });

    it('should handle notification creation with optional fields', async () => {
        // Arrange
        const mockData = {
            recipient: 'user456',
            message: 'Warning Message',
            type: 'WARNING' as const,
            relatedId: 'related123',
            link: '/dashboard',
        };

        (Notification.create as jest.Mock).mockResolvedValue({ _id: 'notif456', ...mockData });

        // Act
        await service.createNotification(mockData);

        // Assert
        expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
            relatedId: 'related123',
            link: '/dashboard',
        }));
    });
});
