import { User } from '@/domain/entities/user';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface UpdateBusinessProfileInput {
  userId: string;
  businessName: string;
  slug: string;
}

@Injectable()
export class UpdateBusinessProfileUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateBusinessProfileInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const normalizedSlug = input.slug.toLowerCase().trim();

    if (normalizedSlug !== user.slug) {
      const existingUser = await this.userRepository.findBySlug(normalizedSlug);
      if (existingUser && existingUser.id !== user.id) {
        throw new BusinessRuleError(
          'Slug is already in use',
          'SLUG_ALREADY_IN_USE',
        );
      }
    }

    user.updateBusinessProfile(input.businessName, normalizedSlug);

    await this.userRepository.save(user);

    return user;
  }
}
