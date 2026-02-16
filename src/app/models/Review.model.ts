import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    appointment: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
}

const reviewSchema = new Schema<IReview>(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        appointment: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

// Prevent duplicate reviews for the same appointment
reviewSchema.index({ appointment: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
