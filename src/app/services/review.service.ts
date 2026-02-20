import Review, { IReview } from '../models/Review.model';
import Doctor from '../models/Doctor.model';
import { CreateReviewDto } from '../dto/review.dto';
import mongoose from 'mongoose';
import { getIO } from '../socket/socket.controller';

export class ReviewService {

    async createReview(patientId: string, dto: CreateReviewDto) {
        // Upsert review directly without requiring an appointment
        const review = await Review.findOneAndUpdate(
            { patient: patientId, doctor: dto.doctorId },
            { rating: dto.rating, comment: dto.comment || "" },
            { new: true, upsert: true }
        );

        // Update Doctor Stats (Aggregated)
        await this.updateDoctorStats(dto.doctorId);

        return review;
    }

    async getReviewsForDoctor(doctorId: string) {
        return Review.find({ doctor: doctorId }).populate('patient', 'firstName lastName email image');
    }

    private async updateDoctorStats(doctorId: string) {
        const stats = await Review.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: '$doctor',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            const avgRating = Math.round(stats[0].avgRating * 10) / 10;
            const totalReviews = stats[0].totalReviews;

            await Doctor.findByIdAndUpdate(doctorId, {
                averageRating: avgRating,
                totalReviews: totalReviews
            });

            // Broadcast the updated rating to all connected clients
            try {
                const io = getIO();
                io.emit('doctor_rating_updated', {
                    doctorId,
                    averageRating: avgRating,
                    totalReviews: totalReviews
                });
            } catch (ioError) {
                console.warn('[SOCKET] Could not emit doctor_rating_updated:', ioError);
            }
        }
    }
}
