import { User } from '@/domain/entities/user';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface UpdateProfileInput {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

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
