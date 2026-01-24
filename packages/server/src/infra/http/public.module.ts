import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GetProviderBySlugUseCase } from '@/application/use-cases/user/get-provider-by-slug.use-case';
import { FetchAvailableSlotsUseCase } from '@/application/use-cases/appointment/fetch-available-slots.use-case';
import { CreateAppointmentUseCase } from '@/application/use-cases/appointment/create-appointment.use-case';
import { ListServicesUseCase } from '@/application/use-cases/service/list-services.use-case';
import { PublicController } from './controllers/public.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    GetProviderBySlugUseCase,
    FetchAvailableSlotsUseCase,
    CreateAppointmentUseCase,
    ListServicesUseCase,
  ],
  controllers: [PublicController],
  exports: [
    GetProviderBySlugUseCase,
    FetchAvailableSlotsUseCase,
    CreateAppointmentUseCase,
  ],
})
export class PublicModule {}
