import { Appointment } from '@/domain/entities/appointment';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

interface ConfirmAppointmentInput {
  appointmentId: string;
  providerId: string;
}

export class ConfirmAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

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
