import { Service } from '@/domain/entities/service';
import { NotFoundError } from '@/domain/errors';
import { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface ListServicesInput {
  providerId: string;
  onlyActive?: boolean;
}

export class ListServicesUseCase {
  constructor(
    private readonly serviceRepository: IServiceRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: ListServicesInput): Promise<Service[]> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const onlyActive = input.onlyActive ?? true;

    if (onlyActive) {
      return await this.serviceRepository.findActiveByProviderId(
        input.providerId,
      );
    }

    return await this.serviceRepository.findByProviderId(input.providerId);
  }
}
