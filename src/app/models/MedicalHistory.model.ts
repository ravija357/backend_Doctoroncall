import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalHistory extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    appointment?: mongoose.Types.ObjectId;
    diagnosis: string;
    prescription: string; // Could be array of objects, keeping string for MVP
    notes?: string;
    attachments?: string[];
    date: Date;
}

const medicalHistorySchema = new Schema<IMedicalHistory>(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        appointment: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        diagnosis: { type: String, required: true },
        prescription: { type: String, required: true },
        notes: { type: String },
        attachments: { type: [String], default: [] },
        date: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model<IMedicalHistory>('MedicalHistory', medicalHistorySchema);
