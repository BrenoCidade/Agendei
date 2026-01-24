import { Appointment } from '@/domain/entities/appointment';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Inject, Injectable } from '@nestjs/common';

interface ConfirmAppointmentInput {
  appointmentId: string;
  providerId: string;
}

@Injectable()
export class ConfirmAppointmentUseCase {
  constructor(
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(input: ConfirmAppointmentInput): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new NotFoundError('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    if (appointment.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'You do not have permission to confirm this appointment',
        'APPOINTMENT_CONFIRM_FORBIDDEN',
      );
    }

    appointment.confirm();

    await this.appointmentRepository.save(appointment);

    return appointment;
  }
}
