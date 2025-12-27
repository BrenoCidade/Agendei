import { Appointment } from '@/domain/entities/appointment';
import type { CancelationActor } from '@saas/shared';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

interface CancelAppointmentInput {
  appointmentId: string;
  cancelReason: string;
  canceledBy: CancelationActor;
  actorId: string;
}

export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(input: CancelAppointmentInput): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new NotFoundError('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    this.validateCancellationPermission(appointment, input);

    appointment.cancel(input.cancelReason, input.canceledBy);

    await this.appointmentRepository.save(appointment);

    return appointment;
  }

  private validateCancellationPermission(
    appointment: Appointment,
    input: CancelAppointmentInput,
  ): void {
    if (input.canceledBy === 'PROVIDER') {
      if (appointment.providerId !== input.actorId) {
        throw new BusinessRuleError(
          'You do not have permission to cancel this appointment',
          'APPOINTMENT_CANCEL_FORBIDDEN',
        );
      }
    }

    if (input.canceledBy === 'CUSTOMER') {
      if (appointment.customerId !== input.actorId) {
        throw new BusinessRuleError(
          'You do not have permission to cancel this appointment',
          'APPOINTMENT_CANCEL_FORBIDDEN',
        );
      }
    }
  }
}
