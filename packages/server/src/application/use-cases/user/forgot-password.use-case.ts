import type { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type ForgotPasswordInput = {
  email: string;
};

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IEmailGateway')
    private readonly emailGateway: IEmailGateway,
  ) {}

  async execute({ email }: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    const token = randomUUID();
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpires = expiration;

    await this.userRepository.save(user);

    await this.emailGateway.sendRecoveryEmail(user.email, token);
  }
}
