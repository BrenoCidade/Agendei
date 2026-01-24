import { Appointment } from '@/domain/entities/appointment';
import type { AppointmentStatus } from '@saas/shared';
import { NotFoundError } from '@/domain/errors';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface ListAppointmentsInput {
  providerId: string;
  startDate?: Date;
  endDate?: Date;
  status?: AppointmentStatus;
}

@Injectable()
export class ListAppointmentsUseCase {
  constructor(
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject('IUserRepository')
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
