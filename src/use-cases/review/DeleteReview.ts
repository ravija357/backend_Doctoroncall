import { IReviewRepository } from '../../domain/repositories/IReviewRepository';

export class DeleteReview {
    constructor(private reviewRepository: IReviewRepository) { }

    async execute(reviewId: string, patientId: string) {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) throw new Error('Review not found');

        if (review.patient.toString() !== patientId) {
            throw new Error('Unauthorized to delete this review');
        }

        const doctorId = review.doctor;
        await this.reviewRepository.delete(reviewId);

        const stats = await this.reviewRepository.getAverageRatingAndCount(doctorId);

        return { doctorId, stats };
    }
}
