import { Service } from '@/domain/entities/service';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import { Inject, Injectable } from '@nestjs/common';

interface UpdateServiceInput {
  serviceId: string;
  providerId: string;
  name: string;
  description?: string;
  durationInMinutes: number;
  priceInCents: number;
}

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(input: UpdateServiceInput): Promise<Service> {
    const service = await this.serviceRepository.findById(input.serviceId);

    if (!service) {
      throw new NotFoundError('Service not found', 'SERVICE_NOT_FOUND');
    }

    if (service.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'You do not have permission to update this service',
        'SERVICE_UPDATE_FORBIDDEN',
      );
    }

    service.updateDetails(
      input.name,
      input.description ?? null,
      input.durationInMinutes,
      input.priceInCents,
    );

    await this.serviceRepository.save(service);

    return service;
  }
}
