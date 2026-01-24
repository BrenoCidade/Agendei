import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ListAppointmentsUseCase } from '@/application/use-cases/appointment/list-appointments.use-case';
import { ConfirmAppointmentUseCase } from '@/application/use-cases/appointment/confirm-appointment.use-case';
import { CancelAppointmentUseCase } from '@/application/use-cases/appointment/cancel-appointment.use-case';
import { AppointmentsController } from './controllers/appointments.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    ListAppointmentsUseCase,
    ConfirmAppointmentUseCase,
    CancelAppointmentUseCase,
  ],
  controllers: [AppointmentsController],
  exports: [
    ListAppointmentsUseCase,
    ConfirmAppointmentUseCase,
    CancelAppointmentUseCase,
  ],
})
export class AppointmentsModule {}
