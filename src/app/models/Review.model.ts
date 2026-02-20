import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    patient: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
}

const reviewSchema = new Schema<IReview>(
    {
        patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, maxlength: 500 },
    },
    { timestamps: true }
);

// Prevent duplicate reviews for the same doctor by the same patient
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

// Try to drop old index safely if it exists (in dev)
mongoose.connection.on('connected', () => {
    mongoose.connection.collection('reviews').dropIndex('appointment_1').catch(() => { });
});

export default mongoose.model<IReview>('Review', reviewSchema);
