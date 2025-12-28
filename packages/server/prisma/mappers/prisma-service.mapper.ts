import { Service } from '@/domain/entities/service';
import { Service as PrismaService } from '@prisma/client';

export class PrismaServiceMapper {
  static toDomain(raw: PrismaService): Service {
    return new Service({
      id: raw.id,
      name: raw.name,
      description: raw.description ?? undefined,
      durationInMinutes: raw.durationInMinutes,
      priceInCents: raw.priceInCents,
      providerId: raw.providerId,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(
    service: Service,
  ): Omit<PrismaService, 'createdAt' | 'updatedAt'> {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationInMinutes: service.durationInMinutes,
      priceInCents: service.priceInCents,
      providerId: service.providerId,
      isActive: service.isActive,
    };
  }
}
