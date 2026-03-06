import mongoose from 'mongoose';
import ReviewModel from '../../app/models/Review.model';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import { Review } from '../../domain/entities/review.entity';

export class MongooseReviewRepository implements IReviewRepository {
    async createOrUpdate(patientId: string, doctorId: string, rating: number, comment?: string): Promise<Review> {
        const review = await ReviewModel.findOneAndUpdate(
            { patient: patientId, doctor: doctorId },
            { rating, comment: comment || "" },
            { new: true, upsert: true }
        );
        return this.mapToEntity(review);
    }

    async findById(id: string): Promise<Review | null> {
        const review = await ReviewModel.findById(id);
        return review ? this.mapToEntity(review) : null;
    }

    async findByDoctorId(doctorId: string): Promise<Review[]> {
        const reviews = await ReviewModel.find({ doctor: doctorId }).populate('patient', 'firstName lastName email image');
        return reviews.map(r => this.mapToEntity(r));
    }

    async delete(id: string): Promise<void> {
        await ReviewModel.findByIdAndDelete(id);
    }

    async getAverageRatingAndCount(doctorId: string): Promise<{ averageRating: number; totalReviews: number }> {
        const stats = await ReviewModel.aggregate([
            { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
            {
                $group: {
                    _id: '$doctor',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length === 0) return { averageRating: 0, totalReviews: 0 };

        return {
            averageRating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews
        };
    }

    private mapToEntity(doc: any): Review {
        return {
            id: doc._id.toString(),
            patient: doc.patient.toString(),
            doctor: doc.doctor.toString(),
            rating: doc.rating,
            comment: doc.comment,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
}
