import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    date: Date;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    reason?: string;
    notes?: string;
}

const appointmentSchema = new Schema<IAppointment>({
    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    reason: { type: String },
    notes: { type: String }
}, { timestamps: true });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
