"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.markAsRead = exports.getUnreadCount = exports.getContacts = exports.getMessages = void 0;
const Message_model_1 = __importDefault(require("../models/Message.model"));
const AppError_1 = require("../utils/AppError");
const getMessages = async (req, res, next) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user.id;
        const messages = await Message_model_1.default.find({
            $or: [
                { sender: senderId, receiver: userToChatId },
                { sender: userToChatId, receiver: senderId },
            ],
            deletedBy: { $ne: senderId }
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    }
    catch (error) {
        next(new AppError_1.AppError('Error fetching messages', 500));
    }
};
exports.getMessages = getMessages;
const getContacts = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const mongoose = require('mongoose');
        const userIdObj = new mongoose.Types.ObjectId(currentUserId);
        const contacts = await Message_model_1.default.aggregate([
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
                    name: { $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"] },
                    image: "$userDetails.image",
                    role: "$userDetails.role",
                    email: "$userDetails.email",
                    lastMessage: "$lastMessage.content",
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
    }
    catch (error) {
        console.error("Aggregation Error:", error);
        next(new AppError_1.AppError('Error fetching contacts', 500));
    }
};
exports.getContacts = getContacts;
const getUnreadCount = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const count = await Message_model_1.default.countDocuments({
            receiver: currentUserId,
            read: false
        });
        res.status(200).json({
            success: true,
            count
        });
    }
    catch (error) {
        next(new AppError_1.AppError('Error fetching unread count', 500));
    }
};
exports.getUnreadCount = getUnreadCount;
const markAsRead = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { senderId } = req.params;
        await Message_model_1.default.updateMany({
            receiver: currentUserId,
            sender: senderId,
            read: false
        }, {
            $set: { read: true }
        });
        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    }
    catch (error) {
        next(new AppError_1.AppError('Error marking messages as read', 500));
    }
};
exports.markAsRead = markAsRead;
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError_1.AppError('No file uploaded', 400));
        }
        // Construct public URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });
    }
    catch (error) {
        next(new AppError_1.AppError('Error uploading file', 500));
    }
};
exports.uploadFile = uploadFile;
