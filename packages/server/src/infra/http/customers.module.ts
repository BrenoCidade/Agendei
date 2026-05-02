import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ListProviderCustomersUseCase } from '@/application/use-cases/customer/list-provider-customers.use-case';
import { CustomersController } from './controllers/customers.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ListProviderCustomersUseCase],
  controllers: [CustomersController],
  exports: [ListProviderCustomersUseCase],
})
export class CustomersModule {}
