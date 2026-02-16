import { Server, Socket } from 'socket.io';
import Message from '../models/Message.model';

export const initializeSocket = (io: Server) => {
    // Middleware to verify user (simplified for now, ideally use JWT)
    io.use((socket: Socket | any, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) return next(new Error('Invalid userid'));
        socket.userId = userId;
        next();
    });

    const onlineUsers = new Map<string, string>(); // userId -> socketId

    io.on('connection', (socket: Socket | any) => {
        console.log(`[SOCKET] User connected: ${socket.userId} (Socket ID: ${socket.id})`);
        onlineUsers.set(socket.userId, socket.id);

        // Notify friends/everyone that user is online
        io.emit('user_online', { userId: socket.userId });

        // Join a personal room for private messaging
        socket.join(socket.userId);
        console.log(`[SOCKET] User ${socket.userId} joined room ${socket.userId}`);

        // Handle sending messages
        socket.on('send_message', async (data: { receiverId: string; content: string; type?: string }) => {
            const { receiverId, content, type = 'text' } = data;
            console.log(`[MESSAGE] From ${socket.userId} to ${receiverId}: ${content}`);

            // Save to DB
            try {
                const message = await Message.create({
                    sender: socket.userId,
                    receiver: receiverId,
                    content,
                    type
                });

                // Emit to receiver
                io.to(receiverId).emit('receive_message', message);
                // Emit back to sender (confirm/update UI)
                socket.emit('message_sent', message);
            } catch (err) {
                console.error('[MESSAGE] Error saving message:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle deleting messages
        socket.on('delete_message', async (data: { messageId: string; receiverId: string }) => {
            console.log(`[DELETE] Request received for message: ${data.messageId} from user: ${socket.userId}`);
            const { messageId, receiverId } = data;
            try {
                const deletedMessage = await Message.findByIdAndDelete(messageId);
                // ... (rest of delete logic unchanged for brevity) ...
                if (!deletedMessage) {
                    console.warn(`[DELETE] Message not found or already deleted: ${messageId}`);
                } else {
                    console.log(`[DELETE] Successfully deleted message: ${messageId}`);
                }

                // Notify sender
                socket.emit('message_deleted', messageId);

                // Notify receiver
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    // Also emit to room just in case
                    io.to(receiverId).emit('message_deleted', messageId);
                }
            } catch (err) {
                console.error('[DELETE] Error deleting message:', err);
            }
        });

        // Handle clearing chat history
        socket.on('clear_chat', async (data: { receiverId: string }) => {
            // ... (clear chat logic) ...
            const { receiverId } = data;
            const senderId = socket.userId;

            try {
                // Delete all messages between sender and receiver
                await Message.deleteMany({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ]
                });

                console.log(`[CLEAR] Chat cleared between ${senderId} and ${receiverId}`);

                // Notify sender
                socket.emit('chat_cleared', { receiverId });

                // Notify receiver
                io.to(receiverId).emit('chat_cleared', { senderId });

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
            onlineUsers.delete(socket.userId);
            io.emit('user_offline', { userId: socket.userId });
        });
    });
};
