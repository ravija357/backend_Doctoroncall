import User, { IUser } from '../../models/User.model';

export class AuthRepository {
  findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }
}
