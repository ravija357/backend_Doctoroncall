import { IReviewRepository } from '../../domain/repositories/IReviewRepository';

export class GetDoctorReviews {
    constructor(private reviewRepository: IReviewRepository) { }

    async execute(doctorId: string) {
        return this.reviewRepository.findByDoctorId(doctorId);
    }
}
