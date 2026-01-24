import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CreateServiceUseCase } from '@/application/use-cases/service/create-service.use-case';
import { ListServicesUseCase } from '@/application/use-cases/service/list-services.use-case';
import { UpdateServiceUseCase } from '@/application/use-cases/service/update-service.use-case';
import { DeleteServiceUseCase } from '@/application/use-cases/service/delete-service.use-case';
import { ServicesController } from './controllers/services.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    CreateServiceUseCase,
    ListServicesUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
  ],
  controllers: [ServicesController],
  exports: [
    CreateServiceUseCase,
    ListServicesUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
  ],
})
export class ServicesModule {}
