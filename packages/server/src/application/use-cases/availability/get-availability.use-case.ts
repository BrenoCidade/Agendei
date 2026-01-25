import { Availability } from '@/domain/entities/availability';
import { NotFoundError } from '@/domain/errors';
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface GetAvailabilityInput {
  providerId: string;
}

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @Inject('IAvailabilityRepository')
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetAvailabilityInput): Promise<Availability[]> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const availabilities = await this.availabilityRepository.findByProviderId(
      input.providerId,
    );

    return availabilities;
  }
}
