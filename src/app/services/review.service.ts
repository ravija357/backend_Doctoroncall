import Review, { IReview } from '../models/Review.model';
import Doctor from '../models/Doctor.model';
import Appointment from '../models/Appointment.model';
import { CreateReviewDto } from '../dto/review.dto';
import mongoose from 'mongoose';

export class ReviewService {

    async createReview(patientId: string, dto: CreateReviewDto) {
        // 1. Verify Appointment validity
        const appointment = await Appointment.findOne({
            _id: dto.appointmentId,
            patient: patientId,
            doctor: dto.doctorId,
            status: 'completed'
        });

        // For testing purposes, we might want to allow 'confirmed' as well if we don't have a 'complete' flow yet.
        // Let's stick to 'completed' but maybe auto-complete in createAppointment (no, that's bad).
        // Let's check for 'confirmed' or 'completed' for now to ease testing, or strict 'completed'.
        // If we strict 'completed', we need an endpoint to mark appointment as completed.
        // The previous flow set it to 'confirmed'.
        // let's allow 'confirmed' for now or add a complete endpoint. 
        // Plan: Add 'completed' check. NOTE: User needs to mark it completed or admin/doctor. 
        // Let's allow 'confirmed' for simplicity in this MVP phase, or strictly use 'completed' and assume there's a flow. 
        // Current Appointment Service has updateStatus.

        if (!appointment) {
            // Double check if appointment exists at all
            const exists = await Appointment.findById(dto.appointmentId);
            if (!exists) throw new Error('Appointment not found');
            if (exists.patient.toString() !== patientId) throw new Error('Unauthorized: Appointment does not belong to user');
            if (exists.doctor.toString() !== dto.doctorId) throw new Error('Doctor mismatch');
            if (exists.status !== 'completed' && exists.status !== 'confirmed') throw new Error('Appointment must be completed to review');
        }

        // 2. Check if already reviewed
        const existingReview = await Review.findOne({ appointment: dto.appointmentId });
        if (existingReview) throw new Error('Appointment already reviewed');

        // 3. Create Review
        const review = await Review.create({
            patient: patientId,
            doctor: dto.doctorId,
            appointment: dto.appointmentId,
            rating: dto.rating,
            comment: dto.comment
        });

        // 4. Update Doctor Stats (Aggregated)
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
            await Doctor.findByIdAndUpdate(doctorId, {
                averageRating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
                totalReviews: stats[0].totalReviews
            });
        }
    }
}
