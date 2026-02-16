import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
    doctor: mongoose.Types.ObjectId;
    date: Date;
    slots: {
        startTime: string;
        endTime: string;
        isBooked: boolean;
    }[];
}

const availabilitySchema = new Schema<IAvailability>({
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    slots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isBooked: { type: Boolean, default: false }
    }]
}, { timestamps: true });

// Compound index to ensure one availability document per doctor per day
availabilitySchema.index({ doctor: 1, date: 1 }, { unique: true });

export default mongoose.model<IAvailability>('Availability', availabilitySchema);
