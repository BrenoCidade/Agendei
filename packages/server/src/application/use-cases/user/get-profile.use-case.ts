import { User } from '@/domain/entities/user';
import { NotFoundError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface GetProfileInput {
  userId: string;
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetProfileInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }
}
