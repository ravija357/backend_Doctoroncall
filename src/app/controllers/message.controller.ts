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
            deletedBy: { $ne: senderId }
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        next(new AppError('Error fetching messages', 500));
    }
};

export const getContacts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = (req as any).user.id;
        const mongoose = require('mongoose');
        const userIdObj = new mongoose.Types.ObjectId(currentUserId);

        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userIdObj },
                        { receiver: userIdObj }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userIdObj] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver", userIdObj] },
                                        { $eq: ["$read", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    id: "$userDetails._id",
                    name: {
                        $ifNull: [
                            { $trim: { input: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] } } },
                            "$userDetails.email"
                        ]
                    },
                    image: "$userDetails.image",
                    role: "$userDetails.role",
                    email: "$userDetails.email",
                    lastMessage: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$lastMessage.type", "image"] }, then: "📷 Photo" },
                                { case: { $eq: ["$lastMessage.type", "file"] }, then: "📎 Attachment" },
                                { case: { $eq: ["$lastMessage.type", "call_log"] }, then: "📞 Call" }
                            ],
                            default: "$lastMessage.content"
                        }
                    },
                    lastMessageTime: "$lastMessage.createdAt",
                    unread: "$unreadCount"
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error("Aggregation Error:", error);
        next(new AppError('Error fetching contacts', 500));
    }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = (req as any).user.id;
        const count = await Message.countDocuments({
            receiver: currentUserId,
            read: false
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        next(new AppError('Error fetching unread count', 500));
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const currentUserId = (req as any).user.id;
        const { senderId } = req.params;

        await Message.updateMany(
            {
                receiver: currentUserId,
                sender: senderId,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });

        // Emit sync event to all user's devices
        try {
            const { emitToUser } = require('../socket/socket.controller');
            emitToUser(currentUserId, 'notification_sync', {
                type: 'messages_read',
                senderId: senderId
            });
        } catch (syncErr) {
            console.error('[SYNC] Failed to emit message_read sync:', syncErr);
        }
    } catch (error) {
        next(new AppError('Error marking messages as read', 500));
    }
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(new AppError('No file uploaded', 400));
        }

        // Construct public URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        next(new AppError('Error uploading file', 500));
    }
};
