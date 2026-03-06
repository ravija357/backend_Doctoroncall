import { IReviewRepository } from '../../domain/repositories/IReviewRepository';

export class CreateReview {
    constructor(private reviewRepository: IReviewRepository) { }

    async execute(patientId: string, doctorId: string, rating: number, comment?: string) {
        const review = await this.reviewRepository.createOrUpdate(patientId, doctorId, rating, comment);
        const stats = await this.reviewRepository.getAverageRatingAndCount(doctorId);

        return { review, stats };
    }
}
