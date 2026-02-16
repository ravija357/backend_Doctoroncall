import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message.model';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = (req as any).user.id;

        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: userToChatId },
                { sender: userToChatId, receiver: senderId },
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        next(new AppError('Error fetching messages', 500));
    }
};

export const getContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = (req as any).user.id;

        // Find all messages where current user is sender or receiver
        const messages = await Message.find({
            $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        }).sort({ createdAt: -1 });

        // Extract unique contact IDs
        const contactIds = new Set<string>();
        messages.forEach(msg => {
            const otherUser = msg.sender.toString() === currentUserId ? msg.receiver : msg.sender;
            contactIds.add(otherUser.toString());
        });

        // Fetch user details for these contacts
        const contacts = await User.find({ _id: { $in: Array.from(contactIds) } })
            .select('firstName lastName image role _id email');

        // Map to a friendly format
        const formattedContacts = contacts.map(contact => ({
            id: contact._id,
            name: `${contact.firstName} ${contact.lastName}`,
            image: contact.image,
            role: contact.role,
            email: contact.email
        }));

        res.status(200).json({
            success: true,
            data: formattedContacts
        });
    } catch (error) {
        next(new AppError('Error fetching contacts', 500));
    }
};
