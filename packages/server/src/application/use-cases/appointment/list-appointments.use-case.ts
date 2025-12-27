import { Appointment } from '@/domain/entities/appointment';
import type { AppointmentStatus } from '@saas/shared';
import { NotFoundError } from '@/domain/errors';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface ListAppointmentsInput {
  providerId: string;
  startDate?: Date;
  endDate?: Date;
  status?: AppointmentStatus;
}

export class ListAppointmentsUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ListAppointmentsInput): Promise<Appointment[]> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    let appointments: Appointment[];

    if (input.startDate && input.endDate) {
      appointments =
        await this.appointmentRepository.findByProviderAndDateRange(
          input.providerId,
          input.startDate,
          input.endDate,
        );
    } else {
      appointments = await this.appointmentRepository.findByProviderId(
        input.providerId,
      );
    }

    if (input.status) {
      appointments = appointments.filter((apt) => apt.status === input.status);
    }

    return appointments.sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
  }
}
