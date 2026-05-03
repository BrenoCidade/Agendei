import { Inject, Injectable } from '@nestjs/common';
import { ValidationError, NotFoundError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import * as bcrypt from 'bcryptjs';

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new ValidationError('Senha atual incorreta', 'INVALID_CURRENT_PASSWORD');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
    user.updatePassword(newPasswordHash);

    await this.userRepository.save(user);
  }
}
