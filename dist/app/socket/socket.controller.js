"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = exports.sendNotificationToUser = exports.getIO = void 0;
const Message_model_1 = __importDefault(require("../models/Message.model"));
let ioInstance;
const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized!");
    }
    return ioInstance;
};
exports.getIO = getIO;
const sendNotificationToUser = (userId, notification) => {
    if (!ioInstance)
        return;
    ioInstance.to(userId).emit('receive_notification', notification);
};
exports.sendNotificationToUser = sendNotificationToUser;
const initializeSocket = (io) => {
    ioInstance = io;
    // Middleware to verify user (simplified for now, ideally use JWT)
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId)
            return next(new Error('Invalid userid'));
        socket.userId = userId;
        next();
    });
    const onlineUsers = new Map(); // userId -> socketId
    io.on('connection', (socket) => {
        console.log(`[SOCKET] User connected: ${socket.userId} (Socket ID: ${socket.id})`);
        onlineUsers.set(socket.userId, socket.id);
        // Notify friends/everyone that user is online
        io.emit('user_online', { userId: socket.userId });
        // Join a personal room for private messaging
        socket.join(socket.userId);
        console.log(`[SOCKET] User ${socket.userId} joined room ${socket.userId}`);
        // Handle sending messages
        socket.on('send_message', async (data) => {
            const { receiverId, content, type = 'text' } = data;
            console.log(`[MESSAGE] From ${socket.userId} to ${receiverId}: ${content}`);
            // Save to DB
            try {
                const message = await Message_model_1.default.create({
                    sender: socket.userId,
                    receiver: receiverId,
                    content,
                    type
                });
                // Emit to receiver
                io.to(receiverId).emit('receive_message', message);
                // Emit back to sender (confirm/update UI)
                socket.emit('message_sent', message);
            }
            catch (err) {
                console.error('[MESSAGE] Error saving message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle deleting messages
        socket.on('delete_message', async (data) => {
            console.log(`[DELETE] Request received for message: ${data.messageId} from user: ${socket.userId} type: ${data.type}`);
            const { messageId, receiverId, type } = data;
            try {
                if (type === 'everyone') {
                    const deletedMessage = await Message_model_1.default.findByIdAndDelete(messageId);
                    if (!deletedMessage) {
                        console.warn(`[DELETE] Message not found or already deleted: ${messageId}`);
                    }
                    else {
                        console.log(`[DELETE] Successfully deleted message for everyone: ${messageId}`);
                        // Notify sender
                        socket.emit('message_deleted', messageId);
                        // Notify receiver
                        io.to(receiverId).emit('message_deleted', messageId);
                    }
                }
                else {
                    // Delete for me
                    await Message_model_1.default.findByIdAndUpdate(messageId, {
                        $addToSet: { deletedBy: socket.userId }
                    });
                    console.log(`[DELETE] Successfully deleted message for user ${socket.userId}: ${messageId}`);
                    // Notify sender only
                    socket.emit('message_deleted', messageId);
                }
            }
            catch (err) {
                console.error('[DELETE] Error deleting message:', err);
            }
        });
        // Handle clearing chat history
        socket.on('clear_chat', async (data) => {
            const { receiverId, type } = data;
            const senderId = socket.userId;
            try {
                const filter = {
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ]
                };
                if (type === 'everyone') {
                    // Delete all messages between sender and receiver
                    await Message_model_1.default.deleteMany(filter);
                    console.log(`[CLEAR] Chat cleared for EVERYONE between ${senderId} and ${receiverId}`);
                    // Notify sender
                    socket.emit('chat_cleared', { receiverId });
                    // Notify receiver
                    io.to(receiverId).emit('chat_cleared', { senderId });
                }
                else {
                    // Clear for me
                    await Message_model_1.default.updateMany(filter, {
                        $addToSet: { deletedBy: senderId }
                    });
                    console.log(`[CLEAR] Chat cleared for USER ${senderId} with ${receiverId}`);
                    // Notify sender only
                    socket.emit('chat_cleared', { receiverId });
                }
            }
            catch (err) {
                console.error('[CLEAR] Error clearing chat:', err);
            }
        });
        // --- Call Signaling ---
        socket.on('call_user', (data) => {
            console.log(`[CALL] Request to Room ${data.userToCall} from ${socket.userId}`);
            console.log(`[CALL] Payload:`, { from: data.from, name: data.name, hasSignal: !!data.signalData, type: data.callType });
            // Emit to the user's room (reaches all open tabs)
            io.to(data.userToCall).emit('call_user', {
                signal: data.signalData,
                from: data.from,
                name: data.name,
                callType: data.callType
            });
        });
        socket.on('answer_call', (data) => {
            console.log(`[CALL] Answer to Room ${data.to} from ${socket.userId}`);
            io.to(data.to).emit('call_accepted', data.signal);
        });
        socket.on('ice_candidate', (data) => {
            console.log(`[ICE] Candidate to Room ${data.to}`);
            io.to(data.to).emit('ice_candidate', data.candidate);
        });
        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${socket.userId}`);
            onlineUsers.delete(socket.userId);
            io.emit('user_offline', { userId: socket.userId });
        });
    });
};
exports.initializeSocket = initializeSocket;
