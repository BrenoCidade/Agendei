import { Service } from '@/domain/entities/service';
import { NotFoundError } from '@/domain/errors';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface ListServicesInput {
  providerId: string;
  onlyActive?: boolean;
}

@Injectable()
export class ListServicesUseCase {
  constructor(
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
    @Inject('IUserRepository')
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
