import { Review } from '../entities/review.entity';

export interface IReviewRepository {
    createOrUpdate(patientId: string, doctorId: string, rating: number, comment?: string): Promise<Review>;
    findById(id: string): Promise<Review | null>;
    findByDoctorId(doctorId: string): Promise<Review[]>;
    delete(id: string): Promise<void>;
    getAverageRatingAndCount(doctorId: string): Promise<{ averageRating: number; totalReviews: number }>;
}
