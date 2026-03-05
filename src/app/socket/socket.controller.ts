import { Server, Socket } from 'socket.io';
import Message from '../models/Message.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';

let ioInstance: Server;

export const getIO = () => {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized!");
    }
    return ioInstance;
};

export const sendNotificationToUser = (userId: string, notification: any) => {
    if (!ioInstance) return;
    ioInstance.to(userId).emit('receive_notification', notification);
};

/**
 * Sends a sync event to all devices (Mobile/Web) that the specific user is logged into.
 * This is the core of the "Facebook-like" synchronization.
 */
export const emitToUser = (userId: string, event: string, data: any) => {
    if (!ioInstance) return;
    ioInstance.to(userId.toString()).emit(event, data);
};

export const initializeSocket = (io: Server) => {
    ioInstance = io;
    // Middleware to verify user (simplified for now, ideally use JWT)
    io.use((socket: Socket | any, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) return next(new Error('Invalid userid'));
        socket.userId = userId;
        next();
    });

    const onlineUsers = new Map<string, number>(); // userId -> connection count (multi-tab support)

    io.on('connection', (socket: Socket | any) => {
        console.log(`[SOCKET] User connected: ${socket.userId} (Socket ID: ${socket.id})`);

        // Increment connection count (multi-tab: user stays online until all tabs close)
        const prevCount = onlineUsers.get(socket.userId) || 0;
        onlineUsers.set(socket.userId, prevCount + 1);

        // Send current online user list to just this newly connected socket
        socket.emit('online_users_list', Array.from(onlineUsers.keys()));

        // If this is their first connection, broadcast to everyone else
        if (prevCount === 0) {
            socket.broadcast.emit('user_online', { userId: socket.userId });
        }

        // Join a personal room for private messaging
        socket.join(socket.userId);
        console.log(`[SOCKET] User ${socket.userId} joined room ${socket.userId}`);

        // Handle sending messages
        socket.on('send_message', async (data: { receiverId: string; content: string; type?: string; fileUrl?: string; fileName?: string }) => {
            const { receiverId, content, type = 'text', fileUrl, fileName } = data;
            console.log(`[MESSAGE] From ${socket.userId} to ${receiverId}: ${content}`);

            // Save to DB
            try {
                const message = await Message.create({
                    sender: socket.userId,
                    receiver: receiverId,
                    content,
                    type,
                    ...(fileUrl && { fileUrl }),
                    ...(fileName && { fileName }),
                });

                // Emit to receiver
                const sender = await User.findById(socket.userId).select('firstName lastName').lean();
                const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone';

                io.to(receiverId).emit('receive_message', {
                    ...message.toObject(),
                    senderName
                });

                // Emit back to sender (confirm/update UI)
                socket.emit('message_sent', message);

                // ── Real-time Notification (Signal Only) ──────────────────
                // We don't save messages to the Notification collection anymore to avoid cluttering human-readable notifications.
                // We just emit receive_message to the receiver so they get a popup/badge.
                // receive_message is emitted above line 70.
                // ─────────────────────────────────────────────────────────

            } catch (err) {
                console.error('[MESSAGE] Error saving message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });


        // Handle deleting messages
        socket.on('delete_message', async (data: { messageId: string; receiverId: string; type: 'me' | 'everyone' }) => {
            console.log(`[DELETE] Request received for message: ${data.messageId} from user: ${socket.userId} type: ${data.type}`);
            const { messageId, receiverId, type } = data;

            try {
                if (type === 'everyone') {
                    const deletedMessage = await Message.findByIdAndDelete(messageId);
                    if (!deletedMessage) {
                        console.warn(`[DELETE] Message not found or already deleted: ${messageId}`);
                    } else {
                        console.log(`[DELETE] Successfully deleted message for everyone: ${messageId}`);
                        // Notify sender
                        socket.emit('message_deleted', messageId);
                        // Notify receiver
                        io.to(receiverId).emit('message_deleted', messageId);
                    }
                } else {
                    // Delete for me
                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: { deletedBy: socket.userId }
                    });
                    console.log(`[DELETE] Successfully deleted message for user ${socket.userId}: ${messageId}`);
                    // Notify sender only
                    socket.emit('message_deleted', messageId);
                }
            } catch (err) {
                console.error('[DELETE] Error deleting message:', err);
            }
        });

        // Handle clearing chat history
        socket.on('clear_chat', async (data: { receiverId: string; type: 'me' | 'everyone' }) => {
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
                    await Message.deleteMany(filter);
                    console.log(`[CLEAR] Chat cleared for EVERYONE between ${senderId} and ${receiverId}`);

                    // Notify sender
                    socket.emit('chat_cleared', { receiverId });
                    // Notify receiver
                    io.to(receiverId).emit('chat_cleared', { senderId });
                } else {
                    // Clear for me
                    await Message.updateMany(filter, {
                        $addToSet: { deletedBy: senderId }
                    });
                    console.log(`[CLEAR] Chat cleared for USER ${senderId} with ${receiverId}`);
                    // Notify sender only
                    socket.emit('chat_cleared', { receiverId });
                }

            } catch (err) {
                console.error('[CLEAR] Error clearing chat:', err);
            }
        });

        // --- Call Signaling ---
        socket.on('call_user', (data: { userToCall: string; signalData: any; from: string; name: string; callType: string }) => {
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

        socket.on('answer_call', (data: { to: string; signal: any }) => {
            console.log(`[CALL] Answer to Room ${data.to} from ${socket.userId}`);
            io.to(data.to).emit('call_accepted', data.signal);
        });

        socket.on('ice_candidate', (data: { to: string; candidate: any }) => {
            console.log(`[ICE] Candidate to Room ${data.to}`);
            io.to(data.to).emit('ice_candidate', data.candidate);
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${socket.userId}`);
            const count = (onlineUsers.get(socket.userId) || 1) - 1;
            if (count <= 0) {
                onlineUsers.delete(socket.userId);
                // Only broadcast offline when ALL tabs are closed
                io.emit('user_offline', { userId: socket.userId });
                console.log(`[SOCKET] User ${socket.userId} is now offline`);
            } else {
                onlineUsers.set(socket.userId, count);
                console.log(`[SOCKET] User ${socket.userId} still has ${count} active connection(s)`);
            }
        });
    });
};
