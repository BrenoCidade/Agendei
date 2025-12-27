import { User } from '@/domain/entities/user';
import { BusinessRuleError } from '@/domain/errors';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IPasswordService } from '@/domain/services/IPasswordService';

interface RegisterUserInput {
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new BusinessRuleError(
        'Email is already in use',
        'EMAIL_ALREADY_IN_USE',
      );
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = new User({
      name: input.name,
      email: input.email,
      phone: input.phone,
      businessName: input.businessName,
      passwordHash,
    });

    await this.userRepository.save(user);

    return user;
  }
}
