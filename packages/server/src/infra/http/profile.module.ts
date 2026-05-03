import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GetProfileUseCase } from '@/application/use-cases/user/get-profile.use-case';
import { UpdateProfileUseCase } from '@/application/use-cases/user/update-profile.use-case';
import { UpdateBusinessProfileUseCase } from '@/application/use-cases/user/update-business-profile.use-case';
import { ChangePasswordUseCase } from '@/application/use-cases/user/change-password.use-case';
import { UploadAvatarUseCase } from '@/application/use-cases/user/upload-avatar.use-case';
import { ProfileController } from './controllers/profile.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdateBusinessProfileUseCase,
    ChangePasswordUseCase,
    UploadAvatarUseCase,
  ],
  controllers: [ProfileController],
  exports: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdateBusinessProfileUseCase,
    ChangePasswordUseCase,
    UploadAvatarUseCase,
  ],
})
export class ProfileModule {}
