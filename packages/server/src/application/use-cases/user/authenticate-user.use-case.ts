import { User } from '@/domain/entities/user';
import { NotFoundError, ValidationError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { IPasswordService } from '@/domain/services/IPasswordService';
import { Inject } from '@nestjs/common';

interface AuthenticateUserInput {
  email: string;
  password: string;
}

export class AuthenticateUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordService')
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<User> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new NotFoundError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.passwordService.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new ValidationError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    return user;
  }
}
