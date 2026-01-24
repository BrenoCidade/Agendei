import { Availability } from '@/domain/entities/availability';
import { NotFoundError } from '@/domain/errors';
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface TimeSlot {
  start: string;
  end: string;
}

interface SetAvailabilityInput {
  providerId: string;
  dayOfweek: number;
  slots: TimeSlot[];
}

@Injectable()
export class SetAvailabilityUseCase {
  constructor(
    @Inject('IAvailabilityRepository')
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: SetAvailabilityInput): Promise<Availability> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const existingAvailability =
      await this.availabilityRepository.findByProviderIdAndDay(
        input.providerId,
        input.dayOfweek,
      );

    if (existingAvailability) {
      existingAvailability.updateSlots(input.slots);
      await this.availabilityRepository.save(existingAvailability);
      return existingAvailability;
    }

    const availability = new Availability({
      providerId: input.providerId,
      dayOfWeek: input.dayOfweek,
      slots: input.slots,
    });

    await this.availabilityRepository.save(availability);

    return availability;
  }
}
