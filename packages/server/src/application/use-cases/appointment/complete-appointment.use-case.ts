import { Appointment } from '@/domain/entities/appointment';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

interface CompleteAppointmentInput {
  appointmentId: string;
  providerId: string;
}

export class CompleteAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(input: CompleteAppointmentInput): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new NotFoundError('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    if (appointment.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'You do not have permission to complete this appointment',
        'APPOINTMENT_COMPLETE_FORBIDDEN',
      );
    }

    appointment.complete();

    await this.appointmentRepository.save(appointment);

    return appointment;
  }
}
