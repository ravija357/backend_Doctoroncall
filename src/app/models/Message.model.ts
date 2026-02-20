import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    content: string;
    read: boolean;
    type: 'text' | 'image' | 'call_log' | 'file'; // extensible types
    callDuration?: number; // for call logs
    deletedBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
    {
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        read: { type: Boolean, default: false },
        type: { type: String, enum: ['text', 'image', 'call_log', 'file'], default: 'text' },
        callDuration: { type: Number },
        deletedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

// Index for quick retrieval of chat history between two users
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
