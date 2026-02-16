"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDoctorReviews = exports.createReview = void 0;
const review_service_1 = require("../services/review.service");
const review_dto_1 = require("../dto/review.dto");
const reviewService = new review_service_1.ReviewService();
const createReview = async (req, res) => {
    const validation = review_dto_1.createReviewSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, errors: validation.error.format() });
    }
    try {
        const review = await reviewService.createReview(req.user.id, validation.data);
        return res.status(201).json({ success: true, data: review });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createReview = createReview;
const getDoctorReviews = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const reviews = await reviewService.getReviewsForDoctor(doctorId);
        return res.json({ success: true, data: reviews });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDoctorReviews = getDoctorReviews;
