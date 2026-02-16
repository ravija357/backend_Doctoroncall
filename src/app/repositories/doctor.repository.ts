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

        if (filters.specialization) {
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
            // Requires looking up specific user. 
            // For now, simpler to do population filter or aggregation if we want to filter by user name.
            // We can defer name search or do a 2-step lookup.
            // Let's stick to filters on Doctor model fields for now + bio search
            query.bio = { $regex: filters.name, $options: 'i' };
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
