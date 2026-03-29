import { Inject, Injectable } from '@nestjs/common';
import { Availability } from '@/domain/entities/availability';
import { NotFoundError } from '@/domain/errors';
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';

interface TimeSlot {
  start: string;
  end: string;
}

interface SetWeekAvailabilityInput {
  providerId: string;
  availabilities: Array<{
    dayOfWeek: number;
    slots: TimeSlot[];
  }>;
}

@Injectable()
export class SetWeekAvailabilityUseCase {
  constructor(
    @Inject('IAvailabilityRepository')
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: SetWeekAvailabilityInput): Promise<Availability[]> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const requestedDays = new Set(
      input.availabilities.map((availability) => availability.dayOfWeek),
    );

    const existingAvailabilities = await this.availabilityRepository.findByProviderId(
      input.providerId,
    );

    await Promise.all(
      existingAvailabilities
        .filter((availability) => !requestedDays.has(availability.dayOfWeek))
        .map((availability) =>
          this.availabilityRepository.deleteByProviderAndDay(
            input.providerId,
            availability.dayOfWeek,
          ),
        ),
    );

    const savedAvailabilities = await Promise.all(
      input.availabilities.map(async (item) => {
        const existingAvailability =
          await this.availabilityRepository.findByProviderIdAndDay(
            input.providerId,
            item.dayOfWeek,
          );

        if (existingAvailability) {
          existingAvailability.updateSlots(item.slots);
          await this.availabilityRepository.save(existingAvailability);
          return existingAvailability;
        }

        const availability = new Availability({
          providerId: input.providerId,
          dayOfWeek: item.dayOfWeek,
          slots: item.slots,
        });

        await this.availabilityRepository.save(availability);
        return availability;
      }),
    );

    return savedAvailabilities.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }
}
