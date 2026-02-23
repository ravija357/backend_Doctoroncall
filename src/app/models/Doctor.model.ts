import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
    user: mongoose.Types.ObjectId;
    specialization: string;
    experience: number;
    qualifications: string[];
    bio: string;
    fees: number;
    hospital?: string;
    isVerified: boolean;
    schedules: {
        day: string;
        startTime: string;
        endTime: string;
        isOff: boolean;
    }[];
    averageRating: number;
    totalReviews: number;
    totalPatients: number;
    totalVisits: number;
    onlineConsultations: number;
    totalRevenue: number;
}

const doctorSchema = new Schema<IDoctor>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        specialization: { type: String, required: true },
        experience: { type: Number, required: true },
        qualifications: { type: [String], default: [] },
        bio: { type: String, required: true },
        fees: { type: Number, required: true },
        hospital: { type: String },
        isVerified: { type: Boolean, default: false },
        schedules: [{
            day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            isOff: { type: Boolean, default: false }
        }],
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        totalPatients: { type: Number, default: 0 },
        totalVisits: { type: Number, default: 0 },
        onlineConsultations: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
