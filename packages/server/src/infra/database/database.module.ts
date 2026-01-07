import { Module } from '@nestjs/common';
import { PrismaAppointmentRepository } from './prisma/repositories/prisma-appointment.repository';
import { PrismaAvailabilityRepository } from './prisma/repositories/prisma-availability.repository';
import { PrismaCustomerRepository } from './prisma/repositories/prisma-customer.repository';
import { PrismaServiceRepository } from './prisma/repositories/prisma-service.repository';
import { PrismaUserRepository } from './prisma/repositories/prisma-user.repository';
import { PrismaService } from './prisma/prisma.service';

const repositories = [
  {
    provide: 'IUserRepository',
    useClass: PrismaUserRepository,
  },
  {
    provide: 'IServiceRepository',
    useClass: PrismaServiceRepository,
  },
  {
    provide: 'ICustomerRepository',
    useClass: PrismaCustomerRepository,
  },
  {
    provide: 'IAppointmentRepository',
    useClass: PrismaAppointmentRepository,
  },
  {
    provide: 'IAvailabilityRepository',
    useClass: PrismaAvailabilityRepository,
  },
];

@Module({
  providers: [PrismaService, ...repositories],
  exports: [...repositories],
})
export class DatabaseModule {}
