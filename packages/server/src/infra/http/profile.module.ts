import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GetProfileUseCase } from '@/application/use-cases/user/get-profile.use-case';
import { UpdateProfileUseCase } from '@/application/use-cases/user/update-profile.use-case';
import { UpdateBusinessProfileUseCase } from '@/application/use-cases/user/update-business-profile.use-case';
import { ProfileController } from './controllers/profile.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdateBusinessProfileUseCase,
  ],
  controllers: [ProfileController],
  exports: [
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdateBusinessProfileUseCase,
  ],
})
export class ProfileModule {}
