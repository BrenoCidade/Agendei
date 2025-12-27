import { Service } from '@/domain/entities/service';
import { NotFoundError } from '@/domain/errors';
import { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface CreateServiceInput {
  providerId: string;
  name: string;
  description?: string;
  durationInMinutes: number;
  priceInCents: number;
}

export class CreateServiceUseCase {
  constructor(
    private readonly serviceRepository: IServiceRepository,
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
