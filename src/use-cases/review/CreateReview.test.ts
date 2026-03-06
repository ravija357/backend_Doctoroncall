import { CreateReview } from './CreateReview';
import { IReviewRepository } from '../../domain/repositories/IReviewRepository';

describe('CreateReview Use Case', () => {
    let mockReviewRepository: jest.Mocked<IReviewRepository>;
    let createReviewUseCase: CreateReview;

    beforeEach(() => {
        mockReviewRepository = {
            createOrUpdate: jest.fn(),
            findById: jest.fn(),
            findByDoctorId: jest.fn(),
            delete: jest.fn(),
            getAverageRatingAndCount: jest.fn(),
        } as any;
        createReviewUseCase = new CreateReview(mockReviewRepository);
    });

    it('should create a review and return stats', async () => {
        const patientId = 'p1';
        const doctorId = 'd1';
        const rating = 5;
        const comment = 'Great doc';

        const mockReview = { id: 'r1', patient: patientId, doctor: doctorId, rating, comment };
        const mockStats = { averageRating: 5, totalReviews: 1 };

        mockReviewRepository.createOrUpdate.mockResolvedValue(mockReview);
        mockReviewRepository.getAverageRatingAndCount.mockResolvedValue(mockStats);

        const result = await createReviewUseCase.execute(patientId, doctorId, rating, comment);

        expect(mockReviewRepository.createOrUpdate).toHaveBeenCalledWith(patientId, doctorId, rating, comment);
        expect(mockReviewRepository.getAverageRatingAndCount).toHaveBeenCalledWith(doctorId);
        expect(result).toEqual({ review: mockReview, stats: mockStats });
    });
});
