import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GetAvailabilityUseCase } from '@/application/use-cases/availability/get-availability.use-case';
import { SetAvailabilityUseCase } from '@/application/use-cases/availability/set-availability.use-case';
import { DeleteAvailabilityUseCase } from '@/application/use-cases/availability/delete-availability.use-case';
import { SetWeekAvailabilityUseCase } from '@/application/use-cases/availability/set-week-availability.use-case';
import { AvailabilityController } from './controllers/availability.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    GetAvailabilityUseCase,
    SetAvailabilityUseCase,
    SetWeekAvailabilityUseCase,
    DeleteAvailabilityUseCase,
  ],
  controllers: [AvailabilityController],
  exports: [
    GetAvailabilityUseCase,
    SetAvailabilityUseCase,
    SetWeekAvailabilityUseCase,
    DeleteAvailabilityUseCase,
  ],
})
export class AvailabilityModule {}
