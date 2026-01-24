import { Service } from '@/domain/entities/service';
import { NotFoundError } from '@/domain/errors';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface CreateServiceInput {
  providerId: string;
  name: string;
  description?: string;
  durationInMinutes: number;
  priceInCents: number;
}

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: CreateServiceInput): Promise<Service> {
    const provider = await this.userRepository.findById(input.providerId);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const service = new Service({
      providerId: input.providerId,
      name: input.name,
      description: input.description,
      durationInMinutes: input.durationInMinutes,
      priceInCents: input.priceInCents,
    });

    await this.serviceRepository.save(service);

    return service;
  }
}
