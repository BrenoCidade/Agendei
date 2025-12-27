import { Availability } from '@/domain/entities/availability';
import { NotFoundError } from '@/domain/errors';
import { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface GetAvailabilityInput {
  providerId: string;
}

export class GetAvailabilityUseCase {
  constructor(
    private readonly availabilityRepository: IAvailabilityRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetAvailabilityInput): Promise<Availability[]> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const availabilities =
      await this.availabilityRepository.findActiveByProviderId(
        input.providerId,
      );

    return availabilities;
  }
}
