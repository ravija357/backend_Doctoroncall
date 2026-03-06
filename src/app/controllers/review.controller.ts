import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { createReviewSchema } from '../dto/review.dto';

const reviewService = new ReviewService();

export const createReview = async (req: Request | any, res: Response) => {
    const validation = createReviewSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    try {
        const review = await reviewService.createReview(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: review });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getDoctorReviews = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;
        const reviews = await reviewService.getReviewsForDoctor(doctorId);
        return res.json({ success: true, data: reviews });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteReview = async (req: Request | any, res: Response) => {
    try {
        const { id } = req.params;
        await reviewService.deleteReview(id, req.user.id);
        return res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error: any) {
        const status = error.message === 'Review not found' ? 404 : 400;
        return res.status(status).json({ success: false, message: error.message });
    }
};
