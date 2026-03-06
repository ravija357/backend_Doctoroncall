export interface Review {
    id?: string;
    patient: string;
    doctor: string;
    rating: number;
    comment?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
