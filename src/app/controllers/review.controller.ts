import { Request, Response } from 'express';
import { createReviewSchema } from '../dto/review.dto';
import { MongooseReviewRepository } from '../../infrastructure/repositories/MongooseReviewRepository';
import { CreateReview } from '../../use-cases/review/CreateReview';
import { GetDoctorReviews } from '../../use-cases/review/GetDoctorReviews';
import { DeleteReview } from '../../use-cases/review/DeleteReview';
import { getIO } from '../socket/socket.controller';
import Doctor from '../models/Doctor.model';

const reviewRepository = new MongooseReviewRepository();
const createReviewUseCase = new CreateReview(reviewRepository);
const getDoctorReviewsUseCase = new GetDoctorReviews(reviewRepository);
const deleteReviewUseCase = new DeleteReview(reviewRepository);

export const createReview = async (req: Request | any, res: Response) => {
    const validation = createReviewSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const { review, stats } = await createReviewUseCase.execute(
            req.user.id,
            validation.data.doctorId,
            validation.data.rating,
            validation.data.comment
        );

        // Update Doctor Stats in DB
        await Doctor.findByIdAndUpdate(validation.data.doctorId, {
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews
        });

        // Broadcast updates
        try {
            const io = getIO();
            io.emit('doctor_rating_updated', {
                doctorId: validation.data.doctorId,
                averageRating: stats.averageRating,
                totalReviews: stats.totalReviews
            });
            io.emit('review_sync', { doctorId: validation.data.doctorId });
        } catch (e) {
            console.warn('[SOCKET] Could not emit updates:', e);
        }

        return res.status(201).json({ success: true, data: review });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getDoctorReviews = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;
        const reviews = await getDoctorReviewsUseCase.execute(doctorId);
        return res.json({ success: true, data: reviews });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteReview = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        const { doctorId, stats } = await deleteReviewUseCase.execute(id, req.user.id);

        // Update Doctor Stats in DB
        await Doctor.findByIdAndUpdate(doctorId, {
            averageRating: stats.averageRating,
            totalReviews: stats.totalReviews
        });

        // Broadcast updates
        try {
            const io = getIO();
            io.emit('doctor_rating_updated', {
                doctorId,
                averageRating: stats.averageRating,
                totalReviews: stats.totalReviews
            });
            io.emit('review_sync', { doctorId });
        } catch (e) {
            console.warn('[SOCKET] Could not emit updates:', e);
        }

        return res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
        const status = error.message === 'Review not found' ? 404 : 400;
        return res.status(status).json({ success: false, message: error.message });
    }
};
