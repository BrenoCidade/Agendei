import { User } from '@/domain/entities/user';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IPasswordService } from '@/domain/services/IPasswordService';

interface AuthenticateUserInput {
  email: string;
  password: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
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
