import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import { Inject, Injectable } from '@nestjs/common';

interface DeleteAvailabilityInput {
  availabilityId: string;
  providerId: string;
}

@Injectable()
export class DeleteAvailabilityUseCase {
  constructor(
    @Inject('IAvailabilityRepository')
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(input: DeleteAvailabilityInput): Promise<void> {
    const availability = await this.availabilityRepository.findById(
      input.availabilityId,
    );

    if (!availability) {
      throw new NotFoundError(
        'Availability not found',
        'AVAILABILITY_NOT_FOUND',
      );
    }

    if (availability.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'You do not have permission to delete this availability',
        'AVAILABILITY_DELETE_FORBIDDEN',
      );
    }

    const futureAppointments =
      await this.appointmentRepository.findFutureByProviderAndDay(
        availability.providerId,
        availability.dayOfWeek,
      );

    if (futureAppointments.length > 0) {
      throw new BusinessRuleError(
        'Cannot delete availability with future appointments',
        'AVAILABILITY_HAS_APPOINTMENTS',
      );
    }

    await this.availabilityRepository.delete(input.availabilityId);
  }
}
