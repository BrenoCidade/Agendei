import type { IPasswordService } from '@/domain/services/IPasswordService';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '@/domain/errors';

type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordService')
    private readonly passwordService: IPasswordService,
  ) {}

  async execute({ token, newPassword }: ResetPasswordInput): Promise<void> {
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new ValidationError('Token inválido ou expirado.', 'INVALID_TOKEN');
    }

    const now = new Date();
    if (!user.passwordResetExpires || now > user.passwordResetExpires) {
      throw new ValidationError('Token inválido ou expirado.', 'INVALID_TOKEN');
    }

    const hashedPassword = await this.passwordService.hash(newPassword);
    user.updatePassword(hashedPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.userRepository.save(user);
  }
}
