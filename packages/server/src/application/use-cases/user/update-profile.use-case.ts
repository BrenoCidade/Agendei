import { User } from '@/domain/entities/user';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface UpdateProfileInput {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}

export class UpdateProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new BusinessRuleError('Email already in use', 'EMAIL_IN_USE');
      }
    }

    user.updateProfile(input.name, input.email, input.phone);

    await this.userRepository.save(user);

    return user;
  }
}
