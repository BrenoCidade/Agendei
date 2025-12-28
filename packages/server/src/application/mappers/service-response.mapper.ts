import { ServiceResponseDTO } from '@saas/shared';
import { Service } from '@/domain/entities/service';

export class ServiceResponseMapper {
  static toDTO(service: Service): ServiceResponseDTO {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationInMinutes: service.durationInMinutes,
      priceInCents: service.priceInCents,
      isActive: service.isActive,
      providerId: service.providerId,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
