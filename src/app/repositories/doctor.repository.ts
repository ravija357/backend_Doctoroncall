import Doctor, { IDoctor } from '../models/Doctor.model';

export class DoctorRepository {
    async create(data: Partial<IDoctor>): Promise<IDoctor> {
        return Doctor.create(data);
    }

    async findByUserId(userId: string): Promise<IDoctor | null> {
        return Doctor.findOne({ user: userId });
    }

    async findById(id: string): Promise<IDoctor | null> {
        return Doctor.findById(id).populate('user', '-password');
    }

    async findAllWithFilters(filters: any): Promise<IDoctor[]> {
        const query: any = {};

        if (filters.specialization && filters.specialization !== 'All') {
            query.specialization = { $regex: filters.specialization, $options: 'i' };
        }

        if (filters.minFee || filters.maxFee) {
            query.fees = {};
            if (filters.minFee) query.fees.$gte = Number(filters.minFee);
            if (filters.maxFee) query.fees.$lte = Number(filters.maxFee);
        }

        if (filters.experience) {
            query.experience = { $gte: Number(filters.experience) };
        }

        if (filters.name) {
            // Smarter name search: Search bio OR find users with matching names
            // For simplicity and performance, we'll use an aggregation or separate lookup
            // Let's use a $lookup if we want a single query, but a 2-step lookup is often easier to read

            const User = require('../models/User.model').default;
            const users = await User.find({
                $or: [
                    { firstName: { $regex: filters.name, $options: 'i' } },
                    { lastName: { $regex: filters.name, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map((u: any) => u._id);

            query.$or = [
                { bio: { $regex: filters.name, $options: 'i' } },
                { user: { $in: userIds } }
            ];
        }

        return Doctor.find(query).populate('user', '-password');
    }

    async findAll(): Promise<IDoctor[]> {
        return Doctor.find().populate('user', '-password');
    }

    async update(id: string, data: Partial<IDoctor>): Promise<IDoctor | null> {
        return Doctor.findByIdAndUpdate(id, data, { new: true });
    }
}
