import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import { randomUUID } from 'node:crypto';

interface ForgotPasswordInput {
  email: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailGateway: IEmailGateway,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);

    if (user) {
      const recoveryToken = randomUUID();
      await this.emailGateway.sendRecoveryEmail(user.email, recoveryToken);
    }
  }
}
